import React from "react"
import styled from "@emotion/styled"
import { useRouter } from "next/router"
import Categorybar from "./Categorybar" // 이미 소문자로 수정된 파일명
import usePostsQuery from "src/hooks/usePostsQuery"
import { filterPosts } from "src/libs/utils/notion"

const Feed: React.FC = () => {
  const router = useRouter()
  const category = router.query.category as string
  const posts = usePostsQuery() // 모든 글 데이터
  const filteredPosts = filterPosts(posts) // public 글 필터링

  // 추가로 category나 tag가 있으면 여기서 필터링
  // const finalPosts = filteredPosts.filter((post) => post.category.includes(category))

  return (
    <Container>
      {/* 상단 영역: 페이지 제목 + 포스트 수 */}
      <HeadingWrapper>
        <PageTitle>Dev</PageTitle>
        <PostCount>{`${filteredPosts.length} posts`}</PostCount>
      </HeadingWrapper>

      {/* 카테고리 바 */}
      <Categorybar />

      {/* 게시글 목록 */}
      <PostList>
        {filteredPosts.map((post) => (
          <PostItem key={post.slug}>
            <PostTitle>{post.title}</PostTitle>
            <Excerpt>
              {post.summary /* 혹은 원하는 요약 필드 */}
            </Excerpt>
          </PostItem>
        ))}
      </PostList>
    </Container>
  )
}

export default Feed

/* ===== styled components ===== */
const Container = styled.div`
  /* 전체를 흰 배경으로 하고, 가운데 정렬되도록 */
  background-color: #ffffff;
  max-width: 768px;
  margin: 0 auto;
  padding: 2rem 1rem;
`

const HeadingWrapper = styled.div`
  margin-bottom: 1rem;
`

const PageTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.4;
`

const PostCount = styled.div`
  font-size: 0.875rem;
  color: #666;
`

const PostList = styled.div`
  margin-top: 1rem;
`

const PostItem = styled.div`
  margin-bottom: 1.5rem;
`

const PostTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.4;
`

const Excerpt = styled.p`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #888;
`
