import { colors } from "../styles/colors"
import styled from "@emotion/styled"
import { useRouter } from "next/router"
import React from "react"

const colorArray = [
  colors.light.red4,
  colors.light.green4,
  colors.light.purple4,
  colors.light.orange4,
  colors.light.blue4,
  colors.light.crimson4,
  colors.light.teal4,
  colors.light.pink4,
  colors.light.indigo4,
  colors.light.amber4,
  colors.light.violet4,
  colors.light.cyan4,
  colors.light.brown4,
  colors.light.lime4,
  // colors.light.gold4,
]

type Props = {
  children: string
  postId?: string // 글 ID
  tagIndex?: number // 태그 순서
}

const hashStringToColor = (str: string, colorsArray: string[]) => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = hash * 33 + str.charCodeAt(i)
  }
  const index = Math.abs(hash) % colorsArray.length

  return colorsArray[index]
}

// 글 단위로 태그 색상 관리
const getTagColorForPost = (
  tagName: string,
  postId: string,
  tagIndex: number,
  colorsArray: string[]
) => {
  // 1. 해시 기반으로 기본 색상 선택
  const baseColorIndex =
    Math.abs(
      tagName
        .split("")
        .reduce((hash, char) => hash * 33 + char.charCodeAt(0), 5381)
    ) % colorsArray.length

  // 2. 같은 글 내에서 겹치지 않도록 오프셋 적용
  const adjustedIndex = (baseColorIndex + tagIndex) % colorsArray.length

  return colorsArray[adjustedIndex]
}

const Tag: React.FC<Props> = ({ children, postId = "", tagIndex = 0 }) => {
  const router = useRouter()

  const handleClick = (value: string) => {
    router.push(`/?tag=${value}`)
  }

  const backgroundColor = postId
    ? getTagColorForPost(children, postId, tagIndex, colorArray)
    : hashStringToColor(children, colorArray)

  const StyledTag = styled.div`
    background-color: ${backgroundColor};
    color: ${colors.light.gray10};
    padding: 0.25rem 0.5rem;
    border-radius: 50px;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 400;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  `

  return <StyledTag onClick={() => handleClick(children)}>{children}</StyledTag>
}

export default Tag
