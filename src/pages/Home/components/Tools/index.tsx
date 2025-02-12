import styles from "./index.module.less";
import React from "react";
import SelectIcon from "@/assets/svgs/select.svg";
import PenIcon from "@/assets/svgs/pen.svg";
import RectIcon from "@/assets/svgs/rect.svg";
import CircleIcon from "@/assets/svgs/fullCircle.svg";
import TriangleIcon from "@/assets/svgs/fullTriangle.svg";
import TextIcon from "@/assets/svgs/text.svg";
import ImageIcon from "@/assets/svgs/ic_file_images_normal.svg";
import EraserIcon from "@/assets/svgs/eraser.svg";
import { IDrawTypes } from "@/types";
import LineOutlined from "@ant-design/icons/LineOutlined";

import {
  ColorPicker,
  GetProp,
  message,
  Radio,
  RadioChangeEvent,
  Upload,
  UploadProps,
} from "antd";

interface ITools {
  active: IDrawTypes;
  onChangeDrawType: (key: IDrawTypes) => void;
  onUploadImage: (image: HTMLImageElement) => void;
}
function Tools(props: ITools) {
  const { active, onChangeDrawType, onUploadImage } = props;

  const uploadProps: UploadProps = {
    showUploadList: false,
    beforeUpload: (file) => {
      const isPNG = file.type === "image/png";
      if (!isPNG) {
        message.error(`${file.name} is not a png file`);
      }
      return isPNG || Upload.LIST_IGNORE;
    },
    customRequest: ({ file }) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          onUploadImage(img);
        };
      };
      reader.readAsDataURL(file as Blob);
    },
  };

  const toolList = [
    {
      key: IDrawTypes.select,
      icon: <SelectIcon className={styles["tools-item-icon"]} />,
      text: "Select",
    },
    {
      key: IDrawTypes.pencil,
      icon: <PenIcon className={styles["tools-item-icon"]} />,
      text: "Pen",
    },
    {
      key: IDrawTypes.line,
      icon: <LineOutlined className={styles["tools-item-icon"]} />,
      text: "Line",
    },
    {
      key: IDrawTypes.rect,
      icon: <RectIcon className={styles["tools-item-icon"]} />,
      text: "Rect",
    },
    {
      key: IDrawTypes.circle,
      icon: <CircleIcon className={styles["tools-item-icon"]} />,
      text: "Circle",
    },
    {
      key: IDrawTypes.triangle,
      icon: <TriangleIcon className={styles["tools-item-icon"]} />,
      text: "Triangle",
    },
    {
      key: IDrawTypes.text,
      icon: <TextIcon className={styles["tools-item-icon"]} />,
      text: "Text",
    },
    {
      key: IDrawTypes.image,
      icon: <ImageIcon className={styles["tools-item-icon"]} />,
      text: "Image",
      render: () => {
        return (
          <Upload {...uploadProps}>
            <div className={styles["tools-item"]}>
              <ImageIcon className={styles["tools-item-icon"]} />
              <div className={styles["tools-item-text"]}>Image</div>
            </div>
          </Upload>
        );
      },
    },
    {
      key: IDrawTypes.eraser,
      icon: <EraserIcon className={styles["tools-item-icon"]} />,
      text: "Eraser",
    },
  ];

  return (
    <div className={styles["tools"]}>
      {toolList.map((item) =>
        item?.render ? (
          item.render()
        ) : (
          <div
            className={`${styles["tools-item"]} ${
              active === item.key ? styles["active"] : ""
            }`}
            onClick={() => onChangeDrawType(item.key)}
          >
            {item.icon}
            <div className={styles["tools-item-text"]}>{item.text}</div>
          </div>
        )
      )}
    </div>
  );
}

export default Tools;
