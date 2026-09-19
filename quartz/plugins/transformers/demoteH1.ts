import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"

export const DemoteH1: QuartzTransformerPlugin = () => ({
  name: "DemoteH1",
  markdownPlugins() {
    return [
      () => {
        return (tree: Root) => {
          visit(tree, "heading", (node) => {
            if (node.depth === 1) {
              node.depth = 2
            }
          })
        }
      },
    ]
  },
})
