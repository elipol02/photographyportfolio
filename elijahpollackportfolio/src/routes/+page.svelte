<script lang="ts">
  import { onMount } from "svelte";
  import { fetchData, type FileData, type FolderData } from "../utils/dataLoader.ts";
  import GalleryGrid from '../components/gallery/GalleryGrid.svelte';
  import Navbar from "../components/common/Navbar.svelte";
  //import Footer from "../components/common/Footer.svelte";
  import '../app.css';
  
  let folders: FolderData[] = [];
  let files: FileData[] = [];
  let columns: FileData[][] = [];
  let currentFolder = "photos";
  let scrollContainer: HTMLDivElement;
  //let sortingType = "l";

  onMount(() => {
    loadFolder(currentFolder);
  });

  function handleFolderSelected(folderPath: string) {
    loadFolder(folderPath);
  }

  /*function handleSelectedSorting(type: string) {
    //sortingType = type;
    loadFolder(currentFolder);
  }*/
  
  async function loadFolder(folder: string) {
    try {
      const data = await fetchData();
      currentFolder = folder;
  
      folders = data.folders.filter((f) => f.name.startsWith(folder) && f.name !== folder);
      files = data.files
        .filter((f) => f.folderPath.startsWith(folder))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })); // Sort files by name;

      /*if (sortingType !== "none") {
        files = files.filter((f) => f.type === sortingType);
      }*/

      // reverse order of folders and files
      folders = folders.reverse();
      files = files.reverse();

      // reorder DOM so picture folders stay together in rows
      // collumns based on screen size breakpoints. 3 collumns for desktop, 2 for tablet, 1 for mobile
      const numColumns = window.innerWidth > 768 ? 2 : 1;

      const numRows = Math.ceil(files.length / numColumns);

      columns = Array(numColumns).fill(0).map(() => Array(numRows).fill(0));
      
      // Walk row by row
      let i = 0;
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numColumns; col++) {
          if (i < files.length) {
            columns[col][row] = files[i];
            i++;
          } else {
            columns[col][row] = {url: "none", folderName: "none", folderPath: "none", type: "none", path: "none", size: 0, lastModified: "none", name: "none"};
          }
        }
      }

      console.log("Loaded folder:", folder);
      const fileNames = files.map(file => file.name).join(", ");
      console.log("Files in folder:", fileNames);

    } catch (error) {
      console.error("Error loading folder data:", error);
    }
  }
</script>

<div class="h-screen flex flex-col">
  <!-- Navbar -->
  <div class="sticky top-0 z-10 bg-white">
    <Navbar
      {folders}
      {currentFolder}
      onFolderSelected={handleFolderSelected}
    />
  </div>
  
  <!-- Scrollable Container -->
  <!-- We use relative positioning and place the footer inside this same container -->
  <div class="relative flex-grow overflow-y-auto" bind:this={scrollContainer}>

    <!-- Gallery Grid -->
    <div class="pb-16"> <!-- Add bottom padding so content is visible above the footer -->
      <GalleryGrid {columns}/>
    </div>

    <!-- Footer -->
    <!--<Footer {scrollContainer} />-->
  </div>
</div>
