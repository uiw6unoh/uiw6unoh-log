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
      {/* 왼쪽 사이드바 (Profile, Contact, TagList) */}
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
  /* 전체 레이아웃: 왼쪽 사이드바 + 오른쪽 메인영역 */
  display: grid;
  grid-template-columns: 250px 1fr; /* 왼쪽 250px, 오른쪽 가변 */
  gap: 1rem;
  
  /* 상단/하단 여백 제거 (원하시면 조정 가능) */
  padding: 0;
  margin: 0;

  /* 반응형: 모바일에서는 한 열로 */
  @media (max-width: 768px) {
    display: block;
  }

  /* 왼쪽 사이드바 */
  .leftNav {
    position: sticky;
    top: ${HEADER_HEIGHT - 10}px;
    height: calc(100vh - ${HEADER_HEIGHT}px);
    overflow-y: auto;
    /* 스크롤바 사용자 정의 */
    scrollbar-width: thin;              /* 파이어폭스 전용(얇게) */
    scrollbar-color: transparent transparent; /* 기본색 투명 */

    /* 크롬/사파리 등 웹킷 브라우저 전용 */
    &::-webkit-scrollbar {
      width: 6px; /* 스크롤바 너비 */
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: transparent;  /* 기본은 투명 */
    }
    &:hover::-webkit-scrollbar-thumb {
      background: #99999966; /* 마우스 올리면 약간 보임 */
    }
  }

  /* 오른쪽 메인 */
  .main {
    padding: 2rem 1rem 2rem 1rem; /* 원하는 대로 조정 */
  }

  .footer {
    margin-top: 2rem;
  }
`
