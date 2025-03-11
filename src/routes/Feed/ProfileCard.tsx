import Image from "next/image"
import styled from "@emotion/styled"
import { CONFIG } from "site.config"

const ProfileCard: React.FC = () => {
  return (
    <StyledWrapper>
      <div className="profileRow">
        <div className="avatarBox">
          <Image
            src={CONFIG.profile.image}
            alt="profile"
            fill
            priority
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="infoBox">
          <div className="name">{CONFIG.profile.name}</div>
          <div className="role">{CONFIG.profile.role}</div>
          <div className="bio">{CONFIG.profile.bio}</div>
        </div>
      </div>
    </StyledWrapper>
  )
}

export default ProfileCard

// 동일 간격을 주기 위해 margin-bottom 추가
const StyledWrapper = styled.div`
  margin-bottom: 1.5rem; 

  .profileRow {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .avatarBox {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 9999px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .infoBox {
    .name {
      font-size: 1.125rem;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
    .role {
      font-size: 0.875rem;
      color: ${({ theme }) => theme.colors.gray11};
      margin-bottom: 0.25rem;
    }
    .bio {
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: ${({ theme }) => theme.colors.gray12};
    }
  }
`
