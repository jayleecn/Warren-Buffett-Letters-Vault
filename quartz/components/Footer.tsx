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
    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>
          整理人：太白钓雪，侵权或勘误请扫码私信
        </p>
        <img src={joinSegments(baseDir, "attachments/qrcode.jpg")} alt="微信公众号二维码" style="width: 100px; margin: 10px 0;" />
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              信件源：<a href={link}>{text}</a>
            </li>
          ))}
        </ul>
        <p>
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
        </p>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
