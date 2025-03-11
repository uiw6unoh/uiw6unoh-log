import { useState } from "react"
import styled from "@emotion/styled"

import SearchInput from "./SearchInput"
import { FeedHeader } from "./FeedHeader"
import PostList from "./PostList"
import PinnedPosts from "./PostList/PinnedPosts"
import Footer from "./Footer"
import ProfileCard from "./ProfileCard"
import ContactCard from "./ContactCard"
import TagList from "./TagList"

const HEADER_HEIGHT = 73

export default function Feed() {
  const [q, setQ] = useState("")

  return (
    <StyledWrapper>
      {/* 왼쪽 사이드바 */}
      <aside className="leftNav">
        <ProfileCard />
        <ContactCard />
        <TagList />
      </aside>

      {/* 오른쪽 메인영역 */}
      <section className="main">
        <PinnedPosts q={q} />
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} />
        <FeedHeader />
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
  grid-template-columns: 280px 1fr; /* 왼쪽(280px 고정), 오른쪽(가변) */
  gap: 1.5rem;
  padding: 2rem 0;

  @media (max-width: 768px) {
    /* 모바일에서는 한 열로 쌓기 */
    display: block;
    padding: 0.5rem 0;
  }

  .leftNav {
    position: sticky;
    top: ${HEADER_HEIGHT - 10}px;
    height: calc(100vh - ${HEADER_HEIGHT}px);
    overflow-y: auto;
  }

  .main {
    /* 메인 영역 */
  }

  .footer {
    margin-top: 2rem;
  }
`
