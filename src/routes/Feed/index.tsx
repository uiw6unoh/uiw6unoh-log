import React from "react"
import styled from "@emotion/styled"
import { useRouter } from "next/router"
import Categorybar from "./Categorybar"
import usePostsQuery from "src/hooks/usePostsQuery"
import { filterPosts } from "src/libs/utils/notion"

const Feed: React.FC = () => {
  const router = useRouter()
  const posts = usePostsQuery()
  const filteredPosts = filterPosts(posts) // 공개글 필터링
  const category = router.query.category as string

  return (
    <Container>
      {/* 상단 섹션: 페이지 타이틀 및 포스트 수 */}
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
              {/* 예: post.summary 혹은 원하는 요약 필드 */}
              {post.summary}
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
  background-color: #ffffff; /* 흰 배경 */
  max-width: 768px;
  margin: 0 auto;
  padding: 2rem 1rem;

  /* 모바일 대응 (480px 이하) */
  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
  }
`

const HeadingWrapper = styled.div`
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    margin-bottom: 0.75rem;
  }
`

const PageTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`

const PostCount = styled.div`
  font-size: 0.875rem;
  color: #666;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`

const PostList = styled.div`
  margin-top: 1rem;

  @media (max-width: 480px) {
    margin-top: 0.75rem;
  }
`

const PostItem = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`

const PostTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`

const Excerpt = styled.p`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #888;

  @media (max-width: 480px) {
    margin-top: 0.4rem;
    font-size: 0.85rem;
  }
`
