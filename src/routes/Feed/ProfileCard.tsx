import Image from "next/image"
import styled from "@emotion/styled"
import { CONFIG } from "site.config"

const ProfileCard: React.FC = () => {
  return (
    <StyledWrapper>
      <div className="avatarBox">
        {/* 프로필 이미지를 조금 줄이는 예시(예: 80px) */}
        <Image
          src={CONFIG.profile.image}
          alt="profile"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      <div className="profileText">
        <div className="name">{CONFIG.profile.name}</div>
        <div className="role">{CONFIG.profile.role}</div>
        <div className="bio">{CONFIG.profile.bio}</div>
      </div>
    </StyledWrapper>
  )
}

export default ProfileCard

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 왼쪽 정렬 */
  margin-bottom: 1.5rem;

  .avatarBox {
    position: relative;
    width: 80px;   /* 원하는 사이즈로 조절 */
    height: 80px;
    border-radius: 9999px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .profileText {
    .name {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .role {
      font-size: 0.875rem;
      color: ${({ theme }) => theme.colors.gray11};
      margin-bottom: 0.25rem;
    }
    .bio {
      font-size: 0.75rem;
      line-height: 1.25rem;
      color: ${({ theme }) => theme.colors.gray12};
    }
  }
`
