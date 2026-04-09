#!/usr/bin/env node
/**
 * 마크다운 파일을 Notion 데이터베이스에 포스팅하는 스크립트
 *
 * 사용법:
 *   node scripts/post-to-notion.js <파일경로>
 *
 * .env.local 설정:
 *   NOTION_TOKEN=secret_xxx
 *
 * 옵션 환경변수:
 *   POST_TYPE      Post | Paper               (기본: Post)
 *   POST_CATEGORY  📗 Docs | 💻 Backend | ... (기본: 📗 Docs)
 *   POST_STATUS    Private | Public | ...     (기본: Private)
 *   POST_TAGS      콤마 구분                  (기본: 없음)
 *
 * 예시:
 *   POST_TAGS="Open Source,BLOG,Morethanlog,Error" \
 *   node scripts/post-to-notion.js docs/notion-client-v6-issues.md
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// .env.local 로드
const envPath = path.join(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .forEach(l => {
      const eqIdx = l.indexOf('=')
      if (eqIdx < 0) return
      const k = l.slice(0, eqIdx).trim()
      const v = l.slice(eqIdx + 1).trim()
      if (k && !process.env[k]) process.env[k] = v
    })
}

const TOKEN = process.env.NOTION_TOKEN
const DATABASE_ID = '609547dc-18b7-4027-9c03-b035f9476dff'

if (!TOKEN) {
  console.error('NOTION_TOKEN이 없어요. .env.local에 추가해주세요.')
  process.exit(1)
}

// ─── Inline 파서 ────────────────────────────────────────────────────────────

function parseInline(text) {
  if (!text || !text.trim()) return [{ type: 'text', text: { content: text || '' } }]
  const parts = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push({ type: 'text', text: { content: text.slice(lastIndex, match.index) } })
    if (match[1] !== undefined)
      parts.push({ type: 'text', text: { content: match[1] }, annotations: { bold: true } })
    else if (match[2] !== undefined)
      parts.push({ type: 'text', text: { content: match[2] }, annotations: { italic: true } })
    else if (match[3] !== undefined)
      parts.push({ type: 'text', text: { content: match[3] }, annotations: { code: true } })
    else if (match[4] !== undefined)
      parts.push({ type: 'text', text: { content: match[4], link: { url: match[5] } } })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length)
    parts.push({ type: 'text', text: { content: text.slice(lastIndex) } })
  return parts.length ? parts : [{ type: 'text', text: { content: text } }]
}

// ─── 언어 매핑 ───────────────────────────────────────────────────────────────

function mapLanguage(lang) {
  const map = {
    js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
    py: 'python', sh: 'bash', bash: 'bash', json: 'json',
    java: 'java', sql: 'sql', yaml: 'yaml', yml: 'yaml',
    kotlin: 'kotlin', go: 'go', css: 'css', html: 'html',
  }
  return map[(lang || '').toLowerCase()] || lang || 'plain text'
}

// ─── 마크다운 → Notion 블록 변환 ─────────────────────────────────────────────

function parseMarkdown(content) {
  const lines = content.split('\n')
  const blocks = []
  let i = 0
  let titleSkipped = false

  while (i < lines.length) {
    const line = lines[i]

    // 첫 h1은 페이지 제목으로 사용하므로 스킵
    if (!titleSkipped && line.match(/^#\s/)) {
      titleSkipped = true; i++; continue
    }

    // 이미지
    const imgMatch = line.match(/^!\[.*?\]\((.*?)\)$/)
    if (imgMatch) {
      blocks.push({ type: 'image', image: { type: 'external', external: { url: imgMatch[1] } } })
      i++; continue
    }

    // h2
    if (line.match(/^## /)) {
      blocks.push({ type: 'heading_2', heading_2: { rich_text: parseInline(line.replace(/^## /, '')) } })
      i++; continue
    }

    // h3
    if (line.match(/^### /)) {
      blocks.push({ type: 'heading_3', heading_3: { rich_text: parseInline(line.replace(/^### /, '')) } })
      i++; continue
    }

    // 구분선
    if (line.trim() === '---') {
      blocks.push({ type: 'divider', divider: {} })
      i++; continue
    }

    // 코드 블록
    if (line.match(/^```/)) {
      const lang = line.replace(/^```/, '').trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].match(/^```\s*$/)) { codeLines.push(lines[i]); i++ }
      i++
      blocks.push({
        type: 'code',
        code: { language: mapLanguage(lang), rich_text: [{ type: 'text', text: { content: codeLines.join('\n') } }] },
      })
      continue
    }

    // 테이블
    if (line.match(/^\|/)) {
      const rows = []
      while (i < lines.length && lines[i].match(/^\|/)) {
        rows.push(lines[i].split('|').slice(1, -1).map(c => c.trim()))
        i++
      }
      const dataRows = rows.filter(row => !row.every(c => c.match(/^[-:\s]+$/)))
      if (dataRows.length > 0) {
        blocks.push({
          type: 'table',
          table: {
            table_width: dataRows[0].length,
            has_column_header: true,
            has_row_header: false,
            children: dataRows.map(row => ({
              type: 'table_row',
              table_row: { cells: row.map(cell => parseInline(cell)) },
            })),
          },
        })
      }
      continue
    }

    // 콜아웃 (<aside>)
    if (line.match(/^<aside>/)) {
      const calloutLines = []
      i++
      while (i < lines.length && !lines[i].match(/^<\/aside>/)) {
        if (lines[i].trim()) calloutLines.push(lines[i].trim())
        i++
      }
      i++
      blocks.push({
        type: 'callout',
        callout: { icon: { type: 'emoji', emoji: '💡' }, rich_text: parseInline(calloutLines.join(' ')) },
      })
      continue
    }

    // 빈 줄
    if (line.trim() === '') { i++; continue }

    // 일반 문단
    blocks.push({ type: 'paragraph', paragraph: { rich_text: parseInline(line) } })
    i++
  }

  return blocks
}

// ─── Notion API 요청 ─────────────────────────────────────────────────────────

function notionRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined
    const req = https.request(
      {
        hostname: 'api.notion.com',
        path: urlPath,
        method,
        headers: {
          Authorization: 'Bearer ' + TOKEN,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      res => {
        let result = ''
        res.on('data', d => { result += d })
        res.on('end', () => {
          try {
            const json = JSON.parse(result)
            if (json.object === 'error') reject(new Error('Notion API: ' + json.message))
            else resolve(json)
          } catch (e) { reject(e) }
        })
      }
    )
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function appendBlocks(blockId, blocks) {
  for (let i = 0; i < blocks.length; i += 100) {
    await notionRequest('PATCH', '/v1/blocks/' + blockId + '/children', { children: blocks.slice(i, i + 100) })
  }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const mdPath = process.argv[2]
  if (!mdPath) { console.error('사용법: node scripts/post-to-notion.js <파일경로>'); process.exit(1) }

  const content = fs.readFileSync(path.resolve(mdPath), 'utf-8')
  const lines = content.split('\n')

  // 제목 추출
  const titleLine = lines.find(l => l.match(/^#\s/)) || ''
  const title = titleLine.replace(/^#\s+\*{0,2}/, '').replace(/\*{0,2}$/, '').trim()

  // 요약 추출
  let summary = ''
  let foundTitle = false
  for (const l of lines) {
    if (l.match(/^#\s/)) { foundTitle = true; continue }
    if (!foundTitle || !l.trim() || l.match(/^!/) || l.match(/^#/)) continue
    summary = l.replace(/\*\*/g, '').replace(/`/g, '').trim().slice(0, 200)
    break
  }

  // 슬러그 생성
  const slug = title
    .replace(/\[.*?\]/g, '').replace(/[^\w가-힣\s-]/g, '').trim()
    .toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 50)

  const tags = (process.env.POST_TAGS || '').split(',').map(t => t.trim()).filter(Boolean)
  const meta = {
    type: process.env.POST_TYPE || 'Post',
    category: process.env.POST_CATEGORY || '📗 Docs',
    status: process.env.POST_STATUS || 'Private',
    date: new Date().toISOString().split('T')[0],
  }

  console.log('\n📝 제목: ' + title)
  console.log('📌 슬러그: ' + slug)
  console.log('📂 카테고리: ' + meta.category)
  console.log('🏷️  태그: ' + (tags.join(', ') || '없음'))
  console.log('🔒 상태: ' + meta.status + '\n')

  const blocks = parseMarkdown(content)
  console.log('📦 블록 수: ' + blocks.length)

  const page = await notionRequest('POST', '/v1/pages', {
    parent: { database_id: DATABASE_ID },
    properties: {
      title: { title: [{ type: 'text', text: { content: title } }] },
      slug: { rich_text: [{ type: 'text', text: { content: slug } }] },
      type: { select: { name: meta.type } },
      category: { select: { name: meta.category } },
      status: { select: { name: meta.status } },
      summary: { rich_text: [{ type: 'text', text: { content: summary } }] },
      date: { date: { start: meta.date } },
      ...(tags.length ? { tags: { multi_select: tags.map(t => ({ name: t })) } } : {}),
    },
    children: blocks.slice(0, 100),
  })

  if (blocks.length > 100) {
    console.log('📤 추가 블록 업로드 중...')
    await appendBlocks(page.id, blocks.slice(100))
  }

  console.log('\n✅ 포스팅 완료!')
  console.log('🔗 URL: ' + page.url)
}

main().catch(e => { console.error('오류: ' + e.message); process.exit(1) })
