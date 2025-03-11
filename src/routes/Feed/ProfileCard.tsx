import Image from "next/image"
import styled from "@emotion/styled"
import { CONFIG } from "site.config"

const ProfileCard: React.FC = () => {
  return (
    <StyledWrapper>
      <div className="profileRow">
        <div className="avatarBox">
          {/* 이미지가 원형이 되도록 border-radius 처리 */}
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

const StyledWrapper = styled.div`
  margin-bottom: 1.5rem;

  .profileRow {
    display: flex;
    align-items: center;
    gap: 0.75rem; /* 이미지와 텍스트 사이 간격 */
  }

  .avatarBox {
    position: relative;
    width: 64px;  /* 프로필 이미지 크기 */
    height: 64px;
    border-radius: 9999px; /* 원형 처리 */
    overflow: hidden;      /* 둥글게 잘린 영역 밖 숨김 */
    flex-shrink: 0;
  }

  .infoBox {
    .name {
      font-size: 1.125rem; /* 글자 크기 조절 */
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
