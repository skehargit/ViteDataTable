import { useState, useEffect, useRef } from "react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import 'primeicons/primeicons.css';
import './App.css';

type Artwork = {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
};

// Function to fetch artworks data from the API
const fetchData = async (page: number) => {
  try {
    const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch artworks:", error);
    return { data: [], pagination: { total: 0 } };
  }
};

const App = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);
  const [selectedRowsPerPage, setSelectedRowsPerPage] = useState<Record<number, Artwork[]>>({});
  const [loading, setLoading] = useState(false);
  const [numRowsToSelect, setNumRowsToSelect] = useState(0);
  const overlayPanelRef = useRef<OverlayPanel>(null);

  // Load artworks when the page changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchData(currentPage);
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
      setLoading(false);
    };
    loadData();
  }, [currentPage]);

  // Update selected rows for the current page
  useEffect(() => {
    setSelectedRows(selectedRowsPerPage[currentPage] || []);
  }, [currentPage, selectedRowsPerPage]);

  // Handling row selection
  const handleRowSelection = (e: { value: Artwork[] }) => {
    setSelectedRowsPerPage(prev => ({
      ...prev,
      [currentPage]: e.value,
    }));
  };

  // Handling page change
  const handlePageChange = (e: { page?: number }) => {
    if (e.page !== undefined) {
      setCurrentPage(e.page + 1);
    }
  };

  // Apply row selection
  const applySelection = () => {
    if (numRowsToSelect > 0) {
      let newSelectedRows = [...selectedRows];
      const availableRows = artworks.length;
      // console.log(artworks,'artworks')
      // console.log(newSelectedRows,'newSelectedrows')
      if (availableRows >= numRowsToSelect) {
        newSelectedRows.push(...artworks.slice(0, numRowsToSelect));
      } else {
        const remainingRows = numRowsToSelect - availableRows;
        newSelectedRows.push(...artworks);
        // console.log(newSelectedRows,'newSelectedrows-',remainingRows,'remaining-')
        const nextPage = currentPage + 1;

        fetchData(nextPage).then(data => {
          const extraRows = data.data.slice(0, remainingRows);
          // console.log(extraRows,'extrarows')
          setSelectedRowsPerPage(prev => ({
            ...prev,
            [nextPage]: extraRows,
          }));
        });
      }

      setSelectedRows(newSelectedRows);
      setSelectedRowsPerPage(prev => ({
        ...prev,
        [currentPage]: newSelectedRows,
      }));
      overlayPanelRef.current?.hide();
    }
  };

  //  To open overlay panel with header
  const headerTemplate = () => (
    <div className="header-container">
      <Button
        icon="pi pi-angle-down"
        onClick={(e) => overlayPanelRef.current?.toggle(e)}
        className="p-button-rounded p-button-text"
      />
      <span>Title</span>
    </div>
  );

  return (
    <div className="relative">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      )}

      <OverlayPanel ref={overlayPanelRef}>
        <div className="p-field">
          <input
            type="number"
            value={numRowsToSelect}
            onChange={(e) => setNumRowsToSelect(Number(e.target.value))}
            placeholder="Number of rows..."
            className="p-inputtext p-component"
          />
          <Button label="Submit" onClick={applySelection} className="p-button p-component" />
        </div>
      </OverlayPanel>

      <DataTable
        value={artworks}
        selection={selectedRows}
        onSelectionChange={handleRowSelection}
        selectionMode="multiple"
        paginator
        rows={12}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        totalRecords={totalRecords}
        lazy
        onPage={handlePageChange}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
        <Column field="title" header={headerTemplate} />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Date Start" />
        <Column field="date_end" header="Date End" />
      </DataTable>
        
    </div>
  );
};

export default App;
