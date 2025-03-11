import styled from "@emotion/styled"
import { useRouter } from "next/router"
import React from "react"
import { useTagsQuery } from "src/hooks/useTagsQuery"

const TagList: React.FC = () => {
  const router = useRouter()
  const currentTag = router.query.tag || undefined
  const data = useTagsQuery()

  const handleClickTag = (value: string) => {
    if (currentTag === value) {
      router.push({
        query: {
          ...router.query,
          tag: undefined,
        },
      })
    } else {
      router.push({
        query: {
          ...router.query,
          tag: value,
        },
      })
    }
  }

  return (
    <StyledWrapper>
      <div className="heading">🏷️ Tags</div>
      <div className="list">
        {Object.keys(data).map((key) => (
          <a
            key={key}
            data-active={key === currentTag}
            onClick={() => handleClickTag(key)}
          >
            {key}
          </a>
        ))}
      </div>
    </StyledWrapper>
  )
}

export default TagList

// 동일 간격을 주기 위해 margin-bottom 추가
const StyledWrapper = styled.div`
  margin-bottom: 1.5rem; 

  .heading {
    margin-bottom: 0.5rem;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    a {
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.5rem;

      &:hover {
        background-color: ${({ theme }) => theme.colors.gray4};
      }

      &[data-active="true"] {
        font-weight: 600;
        background-color: ${({ theme }) => theme.colors.gray4};
      }
    }
  }
`
