import { useState } from "react"
import SearchInput from "./SearchInput"
import { FeedHeader } from "./FeedHeader"
import Footer from "./Footer"
import styled from "@emotion/styled"
import TagList from "./TagList"
import MobileProfileCard from "./MobileProfileCard"
import ProfileCard from "./ProfileCard"
import ContactCard from "./ContactCard"
import PostList from "./PostList"
import PinnedPosts from "./PostList/PinnedPosts"

const HEADER_HEIGHT = 73

type Props = {}

const Feed: React.FC<Props> = () => {
  const [q, setQ] = useState("")

  return (
    <StyledWrapper>
      {/* 가운데(주 콘텐츠) */}
      <div className="mid">
        {/* 모바일에서만 보이는 프로필 카드 */}
        <MobileProfileCard />

        {/* 상단 고정글, 검색창, 글목록 */}
        <PinnedPosts q={q} />
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} />
        <FeedHeader />
        <PostList q={q} />

        {/* 푸터 (중앙 하단) */}
        <div className="footer">
          <Footer />
        </div>
      </div>

      {/* 오른쪽 사이드바: Profile → Contact → Tags → Footer */}
      <div
        className="rt"
        css={{
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        <ProfileCard />
        <ContactCard />
        <TagList />

        <div className="footer">
          <Footer />
        </div>
      </div>
    </StyledWrapper>
  )
}

export default Feed

const StyledWrapper = styled.div`
  display: grid;
  gap: 1.5rem;
  padding: 2rem 0;
  /* 2열: 중앙 .mid + 오른쪽 .rt */
  grid-template-columns: 1fr 300px;

  @media (max-width: 768px) {
    /* 모바일에서는 한 열로 쌓기 */
    display: block;
    padding: 0.5rem 0;
  }

  > .mid {
    /* 중앙 콘텐츠 열 */
    grid-column: 1 / span 1;
  }

  > .rt {
    /* 오른쪽 사이드 열 */
    position: sticky;
    top: ${HEADER_HEIGHT - 10}px;
    overflow: auto;
    grid-column: 2 / span 1;
  }

  .footer {
    padding-top: 1rem;
  }
`
