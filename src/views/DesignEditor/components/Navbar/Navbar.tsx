import React from "react"
import { styled, ThemeProvider, DarkTheme } from "baseui"
import { Theme } from "baseui/theme"
import { Button, KIND } from "baseui/button"
import Logo from "~/components/Icons/Logo"
import useDesignEditorContext from "~/hooks/useDesignEditorContext"
import Play from "~/components/Icons/Play"
import { Block } from "baseui/block"
import { useEditor } from "@layerhub-io/react"
import useEditorType from "~/hooks/useEditorType"
import useDesignEditorScenes from "~/hooks/useDesignEditorScenes"
import { nanoid } from "nanoid"
import { IDesign } from "@layerhub-io/types"
import { loadTemplateFonts } from "~/utils/fonts"
import { loadVideoEditorAssets } from "~/utils/video"
import DesignTitle from "./DesignTitle"

const Container = styled<"div", {}, Theme>("div", ({ $theme }) => ({
  height: "64px",
  background: $theme.colors.black,
  display: "grid",
  padding: "0 1.25rem",
  gridTemplateColumns: "240px 1fr 240px",
  alignItems: "center",
}))

export default function () {
  const { setDisplayPreview, setScenes } = useDesignEditorContext()
  const editorType = useEditorType()
  const scenes = useDesignEditorScenes()
  const editor = useEditor()
  const inputFileRef = React.useRef<HTMLInputElement>(null)

  const parseGraphicJSON = () => {
    const currentScene = editor.design.exportToJSON()

    const updatedScenes = scenes.map((scn) => {
      if (scn.id === currentScene.id) {
        return {
          id: currentScene.id,
          layers: currentScene.layers,
          name: currentScene.name,
        }
      }
      return {
        id: scn.id,
        layers: scn.layers,
        name: scn.name,
      }
    })

    const graphicTemplate = {
      id: currentScene.id,
      type: "GRAPHIC",
      name: "Awesome design",
      frame: currentScene.frame,
      content: updatedScenes,
    }
    makeDownload(graphicTemplate)
  }

  const parsePresentationJSON = () => {
    const currentScene = editor.design.exportToJSON()

    const updatedScenes = scenes.map((scn) => {
      if (scn.id === currentScene.id) {
        return {
          id: currentScene.id,
          duration: 5000,
          layers: currentScene.layers,
          name: currentScene.name,
        }
      }
      return {
        id: scn.id,
        duration: 5000,
        layers: scn.layers,
        name: scn.name,
      }
    })

    const presentationTemplate = {
      id: currentScene.id,
      type: "PRESENTATION",
      name: "MY PRESENTATION",
      frame: currentScene.frame,
      content: updatedScenes,
    }
    makeDownload(presentationTemplate)
  }

  const parseVideoJSON = () => {
    const currentScene = editor.design.exportToJSON()

    const updatedScenes = scenes.map((scn) => {
      if (scn.id === currentScene.id) {
        return {
          id: scn.id,
          duration: 5000,
          layers: currentScene.layers,
          name: currentScene.name ? currentScene.name : "",
        }
      }
      return {
        id: scn.id,
        duration: 5000,
        layers: scn.layers,
        name: scn.name ? scn.name : "",
      }
    })

    const videoTemplate = {
      id: currentScene.id,
      type: "VIDEO",
      name: "MY VIDEO",
      frame: currentScene.frame,
      content: updatedScenes,
    }
    makeDownload(videoTemplate)
  }

  const makeDownload = (data: Object) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
    const a = document.createElement("a")
    a.href = dataStr
    a.download = "template.json"
    a.click()
  }

  const makeDownloadTemplate = async () => {
    if (editor) {
      if (editorType === "GRAPHIC") {
        return parseGraphicJSON()
      } else if (editorType === "PRESENTATION") {
        return parsePresentationJSON()
      } else {
        return parseVideoJSON()
      }
    }
  }

  const loadGraphicTemplate = async (payload: any) => {
    const scenes = []

    for (const scene of payload.content) {
      const design: IDesign = {
        name: scene.name,
        frame: payload.frame,
        id: scene.id,
        layers: scene.layers,
        metadata: {},
      }
      const loadedDesign = await loadVideoEditorAssets(design)
      await loadTemplateFonts(loadedDesign)

      const preview = (await editor.renderer.render(loadedDesign)) as string
      scenes.push({ ...loadedDesign, preview })
    }
    return scenes
  }

  const loadPresentationTemplate = async (payload: any) => {
    const scenes = []
    for (const scene of payload.content) {
      const design: IDesign = {
        name: scene.name,
        frame: payload.frame,
        id: scene,
        layers: scene.layers,
        metadata: {},
      }
      const loadedDesign = await loadVideoEditorAssets(design)

      const preview = (await editor.renderer.render(loadedDesign)) as string
      await loadTemplateFonts(loadedDesign)
      scenes.push({ ...loadedDesign, preview })
    }
    return scenes
  }

  const loadVideoTemplate = async (payload: any) => {
    const scenes = []

    for (const scene of payload.content) {
      const design: IDesign = {
        name: "Awesome template",
        frame: payload.frame,
        id: nanoid(),
        layers: scene.layers,
        metadata: {},
        duration: scene.duration,
      }
      const loadedDesign = await loadVideoEditorAssets(design)

      const preview = (await editor.renderer.render(loadedDesign)) as string
      await loadTemplateFonts(loadedDesign)
      scenes.push({ ...loadedDesign, preview })
    }
    return scenes
  }

  const handleImportTemplate = React.useCallback(
    async (data: any) => {
      let template
      if (data.type === "GRAPHIC") {
        template = await loadGraphicTemplate(data)
      } else if (data.type === "PRESENTATION") {
        template = await loadPresentationTemplate(data)
      } else if (data.type === "VIDEO") {
        template = await loadVideoTemplate(data)
      }
      //   @ts-ignore
      setScenes(template)
    },
    [editor]
  )

  const handleInputFileRefClick = () => {
    inputFileRef.current?.click()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (res) => {
        const result = res.target!.result as string
        const design = JSON.parse(result)
        handleImportTemplate(design)
      }
      reader.onerror = (err) => {
        console.log(err)
      }

      reader.readAsText(file)
    }
  }

  return (
    // @ts-ignore
    <ThemeProvider theme={DarkTheme}>
      <Container>
        <div style={{ color: "#ffffff" }}>
          <Logo size={36} />
        </div>
        <DesignTitle />
        <Block $style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
          <input
            multiple={false}
            onChange={handleFileInput}
            type="file"
            id="file"
            ref={inputFileRef}
            style={{ display: "none" }}
          />
          <Button
            size="compact"
            onClick={handleInputFileRefClick}
            kind={KIND.tertiary}
            overrides={{
              StartEnhancer: {
                style: {
                  marginRight: "4px",
                },
              },
            }}
          >
            Import
          </Button>

          <Button
            size="compact"
            onClick={makeDownloadTemplate}
            kind={KIND.tertiary}
            overrides={{
              StartEnhancer: {
                style: {
                  marginRight: "4px",
                },
              },
            }}
          >
            Export
          </Button>
          <Button
            size="compact"
            onClick={() => setDisplayPreview(true)}
            kind={KIND.tertiary}
            overrides={{
              StartEnhancer: {
                style: {
                  marginRight: "4px",
                },
              },
            }}
          >
            <Play size={24} />
          </Button>
        </Block>
      </Container>
    </ThemeProvider>
  )
}
