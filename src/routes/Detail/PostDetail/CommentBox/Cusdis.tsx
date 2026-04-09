import { CONFIG } from "site.config"
import { ReactCusdis } from "react-cusdis"
import styled from "@emotion/styled"
import useScheme from "src/hooks/useScheme"

type Props = {
  id: string
  slug: string
  title: string
}

const Cusdis: React.FC<Props> = ({ id, slug, title }) => {
  const [scheme] = useScheme()

  return (
    <>
      <StyledWrapper id="comments">
        <ReactCusdis
          key={scheme}
          attrs={{
            host: CONFIG.cusdis.config.host,
            appId: CONFIG.cusdis.config.appid,
            pageId: id,
            pageTitle: title,
            pageUrl: `${CONFIG.link}/${slug}`,
            theme: scheme,
          }}
        />
      </StyledWrapper>
    </>
  )
}

export default Cusdis

const StyledWrapper = styled.div`
  margin-top: 2.5rem;
`
