import { useState } from "react"
import styled from "@emotion/styled"

import PinnedPosts from "./PostList/PinnedPosts"
import PostList from "./PostList"
import SearchInput from "./SearchInput"
import Footer from "./Footer"
import ProfileCard from "./ProfileCard"
import ContactCard from "./ContactCard"
//import TagList from "./TagList"  // 제거
import CategoryBar from "./CategoryBar" // 새로 만든 컴포넌트

export default function Feed() {
  const [q, setQ] = useState("")

  return (
    <StyledWrapper>
      {/* 왼쪽 사이드: Profile + Contact */}
      <aside className="leftNav">
        <ProfileCard />
        <ContactCard />
      </aside>

      {/* 오른쪽 메인 영역 */}
      <section className="main">
        {/* 상단: Pinned, Search */}
        <PinnedPosts q={q} />
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} />

        {/* 카테고리 바 (가로) */}
        <CategoryBar />

        {/* 본문: 포스트 목록 */}
        <PostList q={q} />
        <div className="footer">
          <Footer />
        </div>
      </section>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 1rem;
  margin: 0;
  padding: 0;

  @media (max-width: 768px) {
    display: block;
  }

  .leftNav {
    position: sticky;
    top: 63px; /* HEADER_HEIGHT - 10 (등 조정) */
    height: calc(100vh - 63px);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: transparent;
    }
    &:hover::-webkit-scrollbar-thumb {
      background: #99999966;
    }
  }

  .main {
    padding: 2rem 1rem;
  }

  .footer {
    margin-top: 2rem;
  }
`
