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
          <span>github</span>
        </a>
      )}
      {CONFIG.profile.email && (
        <a href={`mailto:${CONFIG.profile.email}`} target="_blank" rel="noreferrer">
          <AiOutlineMail className="icon" />
          <span>email</span>
        </a>
      )}
      {CONFIG.profile.linkedin && (
        <a href={`https://www.linkedin.com/in/${CONFIG.profile.linkedin}`} target="_blank" rel="noreferrer">
          <AiFillLinkedin className="icon" />
          <span>linkedin</span>
        </a>
      )}
    </StyledWrapper>
  )
}

export default ContactCard

const StyledWrapper = styled.div`
  margin-top: 1rem;
  margin-bottom: 2rem; /* 프로필과의 간격 */

  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${({ theme }) => theme.colors.gray11};
    font-size: 0.875rem;

    &:hover {
      text-decoration: underline;
    }

    .icon {
      font-size: 1.25rem;
    }
  }
`
