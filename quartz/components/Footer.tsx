import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"
import { joinSegments, pathToRoot } from "../util/path"

interface Options {
  links: Record<string, string>
}

/** Site attribution: WeChat name「太白钓雪」stays Chinese in every language. */
type FooterCopy = {
  sourceLabel: string
  /** JSX-friendly pieces around the fixed Chinese account name */
  curatorBefore: string
  curatorAfter: string
  qrAlt: string
}

const FOOTER_COPY: Record<string, FooterCopy> = {
  zh: {
    sourceLabel: "信件源：",
    curatorBefore: "整理人：公众号",
    curatorAfter: "（学习和分享价值投资），侵权或勘误请扫码私信",
    qrAlt: "微信公众号二维码",
  },
  "zh-tw": {
    sourceLabel: "信件源：",
    curatorBefore: "整理人：公眾號",
    curatorAfter: "（學習和分享價值投資），侵權或勘誤請掃碼私信",
    qrAlt: "微信公眾號二維碼",
  },
  en: {
    sourceLabel: "Source:",
    curatorBefore: "Compiled by: WeChat Official Account ",
    curatorAfter:
      " (learning and sharing value investing). For copyright infringement or corrections, please scan the QR code and send a private message.",
    qrAlt: "WeChat Official Account QR code",
  },
  es: {
    sourceLabel: "Fuente:",
    curatorBefore: "Compilado por: cuenta oficial de WeChat ",
    curatorAfter:
      " (aprendizaje y divulgación de la inversión en valor). Para infracciones de derechos de autor o correcciones, escanee el código QR y envíe un mensaje privado.",
    qrAlt: "Código QR de la cuenta oficial de WeChat",
  },
  pt: {
    sourceLabel: "Fonte:",
    curatorBefore: "Compilado por: conta oficial do WeChat ",
    curatorAfter:
      " (aprendizado e compartilhamento de value investing). Para infração de direitos autorais ou correções, escaneie o QR code e envie uma mensagem privada.",
    qrAlt: "QR code da conta oficial do WeChat",
  },
  ja: {
    sourceLabel: "出典：",
    curatorBefore: "編集：WeChat公式アカウント",
    curatorAfter:
      "（バリュー投資の学習と共有）。著作権侵害や誤りのご連絡はQRコードをスキャンしてメッセージをお送りください。",
    qrAlt: "WeChat公式アカウントのQRコード",
  },
}

function footerCopyForLocale(locale: string | undefined): FooterCopy {
  const raw = (locale || "zh-CN").toLowerCase()
  // zh-TW / zh-Hant must not collapse to Simplified via split("-")[0]
  if (raw === "zh-tw" || raw.startsWith("zh-tw") || raw.includes("hant") || raw === "zh-hk" || raw === "zh-mo") {
    return FOOTER_COPY["zh-tw"] ?? FOOTER_COPY.zh
  }
  if (raw === "zh-cn" || raw.startsWith("zh-cn") || raw.includes("hans") || raw === "zh") {
    return FOOTER_COPY.zh
  }
  const lang = raw.split("-")[0]
  return FOOTER_COPY[lang] ?? FOOTER_COPY.zh
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg, fileData }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    const baseDir = pathToRoot(fileData.slug!)
    const copy = footerCopyForLocale(cfg.locale)

    return (
      <footer class={`${displayClass ?? ""}`}>
        <ul>
          <li>
            {i18n(cfg.locale).components.footer.createdWith}{" "}
            <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
          </li>
          {Object.entries(links).map(([text, link]) => (
            <li>
              {copy.sourceLabel} <a href={link}>{text}</a>
            </li>
          ))}
          <li>
            {copy.curatorBefore}
            <strong>“太白钓雪”</strong>
            {copy.curatorAfter}
          </li>
          <li>
            <img
              src={joinSegments(baseDir, "attachments/qrcode.jpg")}
              alt={copy.qrAlt}
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
