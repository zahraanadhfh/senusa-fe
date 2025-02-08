import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";
import {Card} from "flowbite-react";

const Dashboard: React.FC = () => {
    const [dataset, setDataset] = useState<any[]>([]);
    const [apiResponse, setApiResponse] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPdf, setIsPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [reportFormat, setReportFormat] = useState<"pdf" | "json">("pdf"); // State untuk format laporan
    const [selectedClass, setSelectedClass] = useState<string>("all"); // State untuk filter kelas
    const [jsonReportResponse, setJsonReportResponse] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ... (state dan variabel lainnya tetap sama)
    const htmlContainerRef = useRef<HTMLDivElement>(null); // Tambahkan ref untuk container HTML

    // Tambahkan useEffect untuk menangani pencarian
    useEffect(() => {
        if (htmlContent && htmlContainerRef.current) {
            const searchInput = htmlContainerRef.current.querySelector('#searchInput');
            const tables = htmlContainerRef.current.querySelectorAll('.table-responsive table');

            const handleSearch = (event: Event) => {
                const filter = (event.target as HTMLInputElement).value.trim().toUpperCase();

                tables.forEach((table) => {
                    const rows = table.querySelectorAll('tr');
                    rows.forEach((row, index) => {
                        // Skip header row
                        if (index === 0) return;

                        const cells = row.querySelectorAll('td');
                        let found = false;

                        cells.forEach((cell) => {
                            if (cell.textContent?.toUpperCase().includes(filter)) {
                                found = true;
                            }
                        });

                        (row as HTMLElement).style.display = found ? '' : 'none';
                    });
                });
            };

            if (searchInput) {
                searchInput.addEventListener('input', handleSearch);
            }

            // Cleanup
            return () => {
                if (searchInput) {
                    searchInput.removeEventListener('input', handleSearch);
                }
            };
        }
    }, [htmlContent]); // Jalankan ulang saat htmlContent berubah

    const loadExcelData = async () => {
        try {
            const filePath = "information_data_run10-13.xlsx";
            const response = await fetch(filePath);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, {type: "array"});

            // Ambil sheet pertama
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Konversi ke JSON dengan header
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

            // Cari index kolom yang dibutuhkan
            const headers = jsonData[0] as string[];
            const acmgIndex = headers.indexOf("acmg_criteria");
            const effectIdIndex = headers.indexOf("effectid_5cls");

            // Validasi kolom
            if (acmgIndex === -1 || effectIdIndex === -1) {
                throw new Error("Kolom ACMG_Criteria atau effectid_5cls tidak ditemukan");
            }

            // Ekstrak data dari baris kedua dan seterusnya
            const extractedData = jsonData.slice(1).map((row: any) => ({
                ACMG_Criteria: row[acmgIndex],
                effectid_5cls: row[effectIdIndex],
                // Tambahkan field lain jika diperlukan
                Uploaded_variation: row[headers.indexOf("Uploaded_variation")]
            }));

            console.log("Data yang diekstrak:", extractedData);
            setDataset(extractedData);
        } catch (error) {
            console.error("Error loading Excel file:", error);
        }
    };

    useEffect(() => {
        loadExcelData().then(r => console.log(r))
    }, []);

    // Define headers dynamically
    const headers = [
        {label: "#Uploaded_variation", key: "id"},
        {label: "Location", key: (data: any) => `${data.seq_region_name}:${data.start}-${data.end}`},
        {label: "Allele", key: (data: any) => data.allele_string},
        {
            label: "Consequence",
            key: (data: any) => data.transcript_consequences?.[0]?.consequence_terms.toString() || "-",
        },
        {label: "IMPACT", key: (data: any) => data.transcript_consequences?.[0]?.impact || "-"},
        {label: "SYMBOL", key: (data: any) => data.transcript_consequences?.[0]?.gene_symbol || "-"},
        {label: "Feature_Type", key: (data: any) => data.transcript_consequences?.[0]?.feature_type || "-"},
        {label: "Feature", key: (data: any) => data.transcript_consequences?.[0]?.transcript_id || "-"},
        {label: "BIOTYPE", key: (data: any) => data.transcript_consequences?.[0]?.biotype || "-"},
        {label: "EXON", key: (data: any) => data.transcript_consequences?.[0]?.exon || "-"},
        {label: "HGVSc", key: (data: any) => data.transcript_consequences?.[0]?.hgvsc || "-"},
        {label: "HGVSp", key: (data: any) => data.transcript_consequences?.[0]?.hgvsp || "-"},
        {label: "cDNA_position", key: (data: any) => data.transcript_consequences?.[0]?.cdna_start || "-"},
        {label: "CDS_position", key: (data: any) => data.transcript_consequences?.[0]?.cds_start || "-"},
        {label: "Protein_position", key: (data: any) => data.transcript_consequences?.[0]?.protein_start || "-"},
        {label: "Codons", key: (data: any) => data.transcript_consequences?.[0]?.codons || "-"},
        {label: "Existing_variation", key: (data: any) => data.transcript_consequences?.[0]?.existing_variation || "-"},
        {label: "SYMBOL_SOURCE", key: (data: any) => data.transcript_consequences?.[0]?.gene_symbol_source || "-"},
        {label: "CANONICAL", key: (data: any) => data.transcript_consequences?.[0]?.canonical || "-"},
        {label: "ENSP", key: (data: any) => data.transcript_consequences?.[0]?.protein_id || "-"},
        {label: "GIVEN_REF", key: (data: any) => data.transcript_consequences?.[0]?.refseq_mapping_gives_used || "-"},
        {label: "USED_REF", key: (data: any) => data.transcript_consequences?.[0]?.refseq_mapping_gives || "-"},
        {label: "PolyPhen", key: (data: any) => data.transcript_consequences?.[0]?.polyphen_prediction || "-"},
        {label: "AF", key: (data: any) => data.transcript_consequences?.[0]?.allele_freq || "-"},
        {label: "PUBMED", key: (data: any) => data.transcript_consequences?.[0]?.pubmed || "-"},
        {label: "CLIN_SIG", key: (data: any) => data.transcript_consequences?.[0]?.clinvar_clnsig || "-"},
        {label: "PHENOTYPES", key: (data: any) => data.phenotype_or_disease || "-"},
        {label: "Class", key: "effectid_5cls"},
        {label: "ACMG_Criteria", key: "ACMG_Criteria"}
        // ... (header lainnya)
    ];

    const chunkArray = (array: string[], chunkSize: number) => {
        const result: string[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
        }
        return result;
    };

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset nilai input file
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setJsonReportResponse(null)
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        console.log(fileExtension);

        if (fileExtension === "vcf") {
            setIsPdf(false);
            // Process VCF file
            const reader = new FileReader();
            reader.onload = async (e: any) => {
                const text = e.target.result;
                const json = parseVCFToJson(text);

                if (json.variants.length > 0) {
                    await postToApiVcf(json);
                } else {
                    alert("No valid variants found in the file.");
                }
            };
            reader.readAsText(file);
        } else if (fileExtension === "pdf") {
            setIsPdf(true);
            const reader = new FileReader();
            reader.onload = async () => {
                await postToApiPdf(file);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Unsupported file type. Please upload a VCF or PDF file.");
            resetFileInput();
        }
    };

    const postToApiPdf = async (file: File) => {
        const apiUrl = "http://127.0.0.1:5000/upload"; // Sesuaikan endpoint Anda

        try {
            setLoading(true);
            setError(null);
            setHtmlContent(null);

            // Create FormData
            const formData = new FormData();
            formData.append("file", file); // Key name "file" sesuai dengan API

            // Make API request
            const response = await axios.post(apiUrl, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                responseType: "text", // Mendapatkan HTML sebagai teks
            });

            // Set response HTML ke dalam state
            setHtmlContent(response.data);
            console.log(response.data);
        } catch (error) {
            console.error("Error uploading file:", error);
            setError("An error occurred while processing the file. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const parseVCFToJson = (vcfContent: string) => {
        const lines = vcfContent.split("\n");
        const variants: string[] = [];

        lines.forEach((line: string) => {
            if (line.startsWith("#")) return;

            const columns = line.split("\t");
            if (columns.length > 1) {
                const variant = columns.slice(0, 8).join(" ");
                variants.push(variant);
            }
        });

        return {variants};
    };

    const postToApiVcf = async (json: { variants: string[] }) => {
        const apiUrl = "https://rest.ensembl.org/vep/human/region/";
        const variantChunks = chunkArray(json.variants, 200);

        try {
            setLoading(true);
            setError(null);
            const allResponses = [];
            for (const chunk of variantChunks) {
                const response = await axios.post(apiUrl, {variants: chunk}, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                });
                console.log(JSON.stringify(response.data));
                allResponses.push(...response.data);
            }

            // Gabungkan data dari API dengan dataset Excel
            const processedResponses = allResponses.map((variant) => {
                const excelRow = dataset.find((row: any) => row.Uploaded_variation === variant.id);
                console.log("Excel Row:", excelRow);
                return {
                    ...variant,
                    effectid_5cls: excelRow ? excelRow.effectid_5cls : "Unknown", // Ambil nilai dari dataset Excel
                    ACMG_Criteria: excelRow ? excelRow.ACMG_Criteria : "No ACMG criteria", // Ambil nilai dari dataset Excel
                };
            });

            setApiResponse(processedResponses);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setError("Failed to upload VCF file. Please try again. Cause: " + errorMessage);
            console.error(error);
            resetFileInput();
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (id: string) => {
        console.log("Generate Report for:", id);
        const apiUrl = "http://127.0.0.1:5001/generate_report"; // Replace with your endpoint URL

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(
                apiUrl,
                {variant: id, format: reportFormat}, // Kirim format yang dipilih
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    responseType: reportFormat === "pdf" ? "blob" : "json", // Sesuaikan responseType
                }
            );

            if (reportFormat === "pdf") {
                // Handle PDF response
                const blob = new Blob([response.data], {type: response.headers["content-type"]});
                const downloadUrl = window.URL.createObjectURL(blob);

                // Preview the PDF in a canvas
                const fileReader = new FileReader();
                fileReader.onload = function (e: ProgressEvent<FileReader>) {
                    const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

                    // Initialize PDF.js to render the PDF
                    pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                        const pageNumber = 1; // Display the first page of the PDF
                        pdf.getPage(pageNumber).then(page => {
                            const canvas = document.getElementById('pdf-preview') as HTMLCanvasElement;
                            const context = canvas.getContext('2d');
                            const viewport = page.getViewport({scale: 1});
                            if (!context) {
                                throw new Error('Failed to get canvas context');
                            }
                            // Set canvas size to match PDF page
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            // Render PDF page to canvas
                            page.render({
                                canvasContext: context,
                                viewport: viewport,
                            });
                        });
                    });
                };
                fileReader.readAsArrayBuffer(blob);

                // Provide the user with the download option
                const link = document.createElement("a");
                link.href = downloadUrl;

                const contentDisposition = response.headers["content-disposition"];
                const filename = contentDisposition
                    ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
                    : "Output_Generate_Report_" + id + ".pdf";

                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                alert("Report downloaded successfully!");
            } else if (reportFormat === "json") {
                // Handle JSON response
                setJsonReportResponse(response.data)
                console.log("JSON Response:", response.data);
                if (!response.data) return;
                const blob = new Blob([JSON.stringify(response.data, null, 2)], {type: "application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = response.data.variant + ".json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert("JSON data received. Check the console for details.");
            }
        } catch (error) {
            console.error("Error generating report:", error);
            setError("Error generating report: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAggregate = async (effect: string) => {
        console.log("Generate Report for:", effect);
        const apiUrl = "http://127.0.0.1:5001/generate_variant_list"; // Replace with your endpoint URL

        try {
            setLoading(true);

            const response = await axios.post(
                apiUrl,
                {effect: effect}, // Kirim format yang dipilih
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    responseType: "blob", // Sesuaikan responseType
                }
            );

            // Handle PDF response
            const blob = new Blob([response.data], {type: response.headers["content-type"]});
            const downloadUrl = window.URL.createObjectURL(blob);

            // Preview the PDF in a canvas
            const fileReader = new FileReader();
            fileReader.onload = function (e: ProgressEvent<FileReader>) {
                const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

                // Initialize PDF.js to render the PDF
                pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                    const pageNumber = 1; // Display the first page of the PDF
                    pdf.getPage(pageNumber).then(page => {
                        const canvas = document.getElementById('pdf-preview') as HTMLCanvasElement;
                        const context = canvas.getContext('2d');
                        const viewport = page.getViewport({scale: 1});
                        if (!context) {
                            throw new Error('Failed to get canvas context');
                        }
                        // Set canvas size to match PDF page
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        // Render PDF page to canvas
                        page.render({
                            canvasContext: context,
                            viewport: viewport,
                        });
                    });
                });
            };
            fileReader.readAsArrayBuffer(blob);

            // Provide the user with the download option
            const link = document.createElement("a");
            link.href = downloadUrl;

            const contentDisposition = response.headers["content-disposition"];
            const filename = contentDisposition
                ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
                : "Output_Generate_VariantList_" + effect + ".pdf";

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert("Report Variant List downloaded successfully!");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setError("Failed to upload VCF file. Please try again. Cause: " + errorMessage);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const navigate = useNavigate();

    return (
        <div className="bg-gray-100 min-h-screen h-full w-screen font-sans">
            <header className="bg-white shadow">
                <div onClick={() => navigate("/")}
                     className="container cursor-pointer mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-purple-600 text-2xl font-bold">SENUSA</h1>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10">
                <div className="mb-6">
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                        Upload Your VCF and PDF File
                    </label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="block w-full p-2 border border-gray-300 rounded-lg text-black"
                    />
                </div>

                {/* Filter by Class */}
                {!isPdf && (
                    <div className="mb-6">
                        <label className="block text-lg font-semibold text-gray-700 mb-2">
                            Filter by Class
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setJsonReportResponse(null)
                                setSelectedClass(e.target.value)
                            }}
                            className="block w-full p-2 border border-gray-300 rounded-lg text-black"
                        >
                            <option value="all">All Classes</option>
                            <option value="pathogenic">Pathogenic</option>
                            <option value="likely pathogenic">Likely Pathogenic</option>
                            <option value="benign">Benign</option>
                            <option value="likely benign">Likely Benign</option>
                            <option value="vus">VUS (Variant of Uncertain Significance)</option>
                        </select>
                    </div>
                )}

                {loading && (
                    <p className="text-black">
                        <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-black animate-spin"
                             viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="#E5E7EB"/>
                            <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentColor"/>
                        </svg>
                        Please wait...
                    </p>
                )}
                {error && <p className="text-red-500">{error}</p>}

                {!loading && !error && htmlContent && (
                    <div
                        ref={htmlContainerRef} // Tambahkan ref ke div container
                        className="w-full"
                        dangerouslySetInnerHTML={{__html: htmlContent}}
                    />
                )}

                {!loading && !error && apiResponse.length > 0 && (
                    <div
                        className="overflow-y-auto max-h-[80vh] overflow-x-auto border border-gray-300 rounded-lg shadow">
                        <div className="mb-4 p-4">
                            <p className="text-gray-700">
                                Showing {apiResponse.filter((variant) => selectedClass === "all" || variant.effectid_5cls.toLowerCase() === selectedClass.toLowerCase()).length} of {apiResponse.length} variants
                            </p>
                        </div>
                        <table className="table-auto w-full bg-white">
                            <thead className="bg-purple-600 text-white sticky top-0">
                            <tr>
                                {headers.map((header) => (
                                    <th className="px-4 py-2 text-left" key={header.label}>
                                        {header.label}
                                    </th>
                                ))}
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {apiResponse
                                .filter((variant) => {
                                    if (selectedClass === "all") return true;
                                    return variant.effectid_5cls.toLowerCase() === selectedClass.toLowerCase();
                                })
                                .map((variant, index) => (
                                    <tr key={index} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                                        {headers.map((header) => (
                                            <td className="border px-4 py-2 text-black" key={header.label}>
                                                {typeof header.key === "function"
                                                    ? header.key(variant)
                                                    : variant[header.key] || "-"}
                                            </td>
                                        ))}
                                        <td className="border px-4 py-2 text-black">
                                            <div className="flex space-x-2 items-center">
                                                <select
                                                    className="border p-1 rounded"
                                                    value={reportFormat}
                                                    onChange={(e) => setReportFormat(e.target.value as "pdf" | "json")}
                                                >
                                                    <option value="pdf">PDF</option>
                                                    <option value="json">JSON</option>
                                                </select>
                                                <button
                                                    className="bg-green-500 text-white px-3 py-1 rounded"
                                                    onClick={() => handleGenerateReport(variant.id)}
                                                >
                                                    Generate
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mb-4 p-4">
                            <button onClick={() => handleGenerateAggregate(selectedClass)}
                                    className="bg-green-500 text-white px-3 py-1 rounded">
                                Aggregate Report
                            </button>
                        </div>
                    </div>
                )}
                {jsonReportResponse && (
                    <Card className="mt-6 w-full bg-gray-900 text-white p-4 shadow-lg">
                      <pre className="whitespace-pre-wrap break-words text-justify">
                        {JSON.stringify(jsonReportResponse, null, 2)}
                      </pre>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default Dashboard;