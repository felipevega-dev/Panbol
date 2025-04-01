declare module 'react-native-html-to-pdf' {
  interface Options {
    html: string;
    fileName?: string;
    base64?: boolean;
    directory?: string;
    height?: number;
    width?: number;
    padding?: number;
  }

  interface FileInfo {
    filePath: string;
    base64?: string;
  }

  export function convert(options: Options): Promise<FileInfo>;
  
  const RNHTMLtoPDF: {
    convert: typeof convert;
  };
  
  export default RNHTMLtoPDF;
}
