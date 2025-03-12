import React from "react"
import styled from "@emotion/styled"
import { CONFIG } from "site.config"
import { AiOutlineGithub, AiOutlineMail, AiFillLinkedin } from "react-icons/ai"

const ContactCard: React.FC = () => {
  return (
    <StyledWrapper>
      {CONFIG.profile.github && (
        <a href={`https://github.com/${CONFIG.profile.github}`} target="_blank" rel="noreferrer">
          <AiOutlineGithub className="icon" />
          <div className="name">github</div>
        </a>
      )}
      {CONFIG.profile.email && (
        <a href={`mailto:${CONFIG.profile.email}`} target="_blank" rel="noreferrer">
          <AiOutlineMail className="icon" />
          <div className="name">email</div>
        </a>
      )}
      {CONFIG.profile.linkedin && (
        <a href={`https://www.linkedin.com/in/${CONFIG.profile.linkedin}`} target="_blank" rel="noreferrer">
          <AiFillLinkedin className="icon" />
          <div className="name">linkedin</div>
        </a>
      )}
    </StyledWrapper>
  )
}

export default ContactCard

const StyledWrapper = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 0.5rem;
    color: ${({ theme }) => theme.colors.gray11};
    padding: 0.5rem;

    &:hover {
      background-color: ${({ theme }) => theme.colors.gray5};
    }

    /* 아이콘 사이즈 원래대로(예: 1.5rem) */
    .icon {
      font-size: 1.5rem;
    }
    .name {
      font-size: 0.875rem;
    }
  }
`
