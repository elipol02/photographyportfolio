export interface FileData {
  url: string;
  path: string;
  folderPath: string;
  folderName: string;
  size: number;
  lastModified: string;
  type?: string;
  name: string;
}

export interface FolderData {
  name: string;
}

const BASE_URL = `https://espphotography.nyc3.digitaloceanspaces.com`;
const CDN_URL = `https://espphotography.nyc3.cdn.digitaloceanspaces.com`;

/**
 * Fetches and parses the XML file listing from the DigitalOcean Space.
 * @returns A promise resolving to an object containing folders and files.
 */
export async function fetchData(): Promise<{
  folders: FolderData[];
  files: FileData[];
}> {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    console.error(`Failed to fetch XML: ${response.statusText}`);
    return { folders: [], files: [] };
  }

  const xmlText = await response.text();
  return parseXML(xmlText);
}

/**
 * Parses the XML file listing to separate folders and files.
 * @param xml The XML string returned by the API.
 * @returns An object containing arrays of folders and files.
 */
function parseXML(xml: string): { folders: FolderData[]; files: FileData[] } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "application/xml");
  const contents = xmlDoc.getElementsByTagName("Contents");

  const folders: FolderData[] = [];
  const files: FileData[] = [];

  Array.from(contents).forEach((content) => {
    const key = content.getElementsByTagName("Key")[0]?.textContent || "";
    const size = parseInt(content.getElementsByTagName("Size")[0]?.textContent || "0", 10);
    const lastModified = content.getElementsByTagName("LastModified")[0]?.textContent || "";

    if (!key) {
      console.warn("Skipping empty key:", content);
      return;
    }

    // Separate folders and files
    if (key.endsWith("/")) {
      folders.push({ name: key });
    } else {
      files.push({
        url: `${CDN_URL}/${key}`,
        path: `${key}`,
        folderPath: `${removeFileName(key)}/`,
        folderName: getFormattedFolderName(key),
        size,
        lastModified,
        type: getFirstLetter(key),
        name: key.split("/").pop() || "", // Extract the file name from the path
      });
    }
  });

  return { folders, files };
}

// Function to remove the file name from the path
function removeFileName(path: string): string {
  const parts = path.split("/"); // Split the path into parts
  return parts.slice(0, -1).join("/"); // Remove the last part (file name) and join back
}

// Function to extract and format the folder name
function getFormattedFolderName(path: string): string {
  const parts = removeFileName(path).split("/"); // Get path without file name and split into parts
  const year = parts[1]; // Extract the year (always the second part)
  const folder = parts[2]; // Extract the folder (third part, if exists)

  if (folder) {
      // Replace dashes with spaces in the folder name
      const formattedFolder = folder.replace(/-/g, " ");
      return `${formattedFolder} ${year}`; // Format as "Folder Year" (e.g., "Oregon Coast 2022")
  }
  return year; // If no folder, return just the year
}

// Function that gets the first letter of the file name at the end of the path
function getFirstLetter(path: string): string {
  const parts = path.split("/"); // Split the path into parts
  const fileName = parts[parts.length - 1]; // Get the last part (file name)
  return fileName.charAt(0); // Get the first character of the file name
}