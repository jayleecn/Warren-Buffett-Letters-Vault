import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"
import { joinSegments, pathToRoot } from "../util/path"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg, fileData }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    const baseDir = pathToRoot(fileData.slug!)
    const isEn = (cfg.locale || "").toLowerCase().startsWith("en")

    const sourceLabel = isEn ? "Source:" : "信件源："
    const curatorLine = isEn
      ? <>Compiled by: WeChat Official Account <strong>"太白钓雪"</strong> (learning and sharing value investing). For copyright infringement or corrections, please scan the QR code and send a private message.</>
      : <>整理人：公众号<strong>“太白钓雪”</strong>（学习和分享价值投资），侵权或勘误请扫码私信</>
    const qrAlt = isEn ? "WeChat Official Account QR code" : "微信公众号二维码"

    return (
      <footer class={`${displayClass ?? ""}`}>
        <ul>
          <li>
            {i18n(cfg.locale).components.footer.createdWith}{" "}
            <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
          </li>
          {Object.entries(links).map(([text, link]) => (
            <li>
              {sourceLabel} <a href={link}>{text}</a>
            </li>
          ))}
          <li>{curatorLine}</li>
          <li>
            <img
              src={joinSegments(baseDir, "attachments/qrcode.jpg")}
              alt={qrAlt}
              style="width: 100px; margin: 10px 0;"
            />
          </li>
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
