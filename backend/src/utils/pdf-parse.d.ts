declare module "pdf-parse" {
  function pdfParse(dataBuffer: Buffer): Promise<{
    numpages: number;
    numrender: number;
    info: {
      Producer?: string;
      Creator?: string;
      CreationDate?: string;
      ModDate?: string;
    };
    metadata: unknown;
    text: string;
  }>;

  export = pdfParse;
}
