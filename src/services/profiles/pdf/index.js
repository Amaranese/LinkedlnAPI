
const { writeFile } = require("fs-extra")
const { join } = require("path")
const PdfPrinter = require("pdfmake")

const buildPDFAsync = async pdfStream =>
  new Promise((resolve, reject) => {
    const chunks = []
    pdfStream.on("data", chunk => {
      console.log(chunk)
      chunks.push(chunk)
    })

    pdfStream.on("error", err => reject(err)) // If there is an error I'll reject the promise

    pdfStream.on("end", () => resolve(Buffer.concat(chunks))) // when the stream ends I'll resolve the promise

    pdfStream.end()
  })

const generatePdf = async data => {
  try {
    console.log(data)
    const fonts = {
      Roboto: {
        normal: "Helvetica",
      },
    }
    const docDefinition = {
      content: [
        "First paragraph",
        "Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines",
      ],
    }

    const printer = new PdfPrinter(fonts)

    const pdfDoc = printer.createPdfKitDocument(docDefinition)

  /*  const pdfBuffer = await buildPDFAsync(pdfDoc)
    const path = join(__dirname, "example.pdf")
    await writeFile(path, pdfBuffer)
    return path*/
    pdfDoc.getBase64((data) => {
        res.writeHead(200,
            {
                'Content-Type':'application/pdf',
                'Content-Disposition':'attachment;filename="CV"'
            })
            const download = Buffer.from(data.toString('utf-8'), 'base64')
            res.end(download)
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = generatePdf