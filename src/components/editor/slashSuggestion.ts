import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { SlashMenuList, type SlashMenuRef } from "./SlashMenu";
import { filterSlashItems, type SlashMenuItem } from "./slashItems";

const slashSuggestion: Omit<SuggestionOptions<SlashMenuItem>, "editor"> = {
  items: ({ query }) => filterSlashItems(query),

  render: () => {
    let component: ReactRenderer<SlashMenuRef> | null = null;
    let wrapper: HTMLDivElement | null = null;

    return {
      onStart: (props) => {
        component = new ReactRenderer(SlashMenuList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.zIndex = "9999";

        const rect = props.clientRect();
        if (rect) {
          wrapper.style.left = `${rect.left}px`;
          wrapper.style.top = `${rect.bottom}px`;
        }

        if (component.element) {
          wrapper.appendChild(component.element);
        }
        document.body.appendChild(wrapper);
      },

      onUpdate: (props) => {
        component?.updateProps(props);

        if (!props.clientRect || !wrapper) return;

        const rect = props.clientRect();
        if (rect) {
          wrapper.style.left = `${rect.left}px`;
          wrapper.style.top = `${rect.bottom}px`;
        }
      },

      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          wrapper?.remove();
          wrapper = null;
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },

      onExit: () => {
        wrapper?.remove();
        wrapper = null;
        component?.destroy();
      },
    };
  },
};

export default slashSuggestion;
