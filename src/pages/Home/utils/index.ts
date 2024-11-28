export const createInputEle = (config: {
  x: number;
  y: number;
  style: Record<string, string>;
}) => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.border = "none";
    input.style.outline = "none";
    input.style.padding = "0";
    input.style.margin = "0";
    input.style.left = config.x + "px";
    input.style.top = config.y + "px";
    input.style.fontSize = "16px";
    input.style.color = config.style.color;
    document.body.appendChild(input);
    input.focus();

    input.onblur = () => {
      resolve(input.value);
      document.body.removeChild(input);
    };

    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    };
  });
};
