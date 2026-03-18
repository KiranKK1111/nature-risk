import React, { useMemo, useRef, useState, useEffect } from "react";
import MaterialReactTable from "material-react-table";
import { Typography } from "@mui/material";
import { useSelector } from "react-redux";
import './TableView.css';

function hasZeroValueForKeys(obj) {
  const keysToCheck = [
    "Ia", "Ib", "II", "III", "AZE", "Ramsar", "World.Heritage.Site", "nonAZE"
  ];
  return keysToCheck.some(key => obj[key] === 0);
}

const ClientAssetsTable = () => {
  const scbAssetData = useSelector((state) => state.geoJson.layers['pointLayerForClientAsset']?.data || []);
  const containerRef = useRef(null);
  const [tableHeight, setTableHeight] = useState(500);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setTableHeight(containerRef.current.clientHeight);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const tableData = useMemo(() => {
    const raw = Array.isArray(scbAssetData)
      ? scbAssetData
      : (scbAssetData.features || []).map((f) => f.properties);

    return raw.map(row => ({
      ...row,
      sustainability_status_value: hasZeroValueForKeys(row) ? "Unsustainable" : "Sustainable",
    }));
  }, [scbAssetData]);

  const columns = useMemo(() => [
    {
      accessorKey: "asset_name",
      header: "Asset Name",
      size: 180,
      minSize: 100,
      Cell: ({ cell }) => (
        <span style={{ color: '#1976d2', cursor: 'pointer', fontWeight: 500 }}>
          {cell.getValue()}
        </span>
      ),
    },
    { accessorKey: "asset_type", header: "Asset Type", size: 140, minSize: 80 },
    { accessorKey: "asset_activity", header: "Asset Activity", size: 140, minSize: 80 },
    {
      id: "category",
      header: "Category",
      size: 100,
      minSize: 70,
      accessorFn: () => "Client Asset",
      enableColumnFilter: false,
      enableSorting: false,
    },
    { accessorKey: "SC_asset_type", header: "SC Asset Type", size: 100, minSize: 70 },
    { accessorKey: "SC_asset_type_sub", header: "SC Type Sub", size: 100, minSize: 70 },
    { accessorKey: "owner", header: "Owner", size: 130, minSize: 80 },
    { accessorKey: "country", header: "Country", size: 70, minSize: 50 },
    {
      accessorKey: "sustainability_status_value",
      header: "Status",
      size: 110,
      minSize: 80,
      filterVariant: "select",
      filterSelectOptions: ["Sustainable", "Unsustainable"],
      Cell: ({ cell }) => {
        const value = cell.getValue();
        if (value === "Sustainable") {
          return (
            <span style={{
              padding: '2px 8px',
              border: '1px solid #87e769',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              color: '#207e00',
              backgroundColor: '#ebfbe6',
              fontSize: 11,
              fontWeight: 600,
            }}>{value}</span>
          );
        } else if (value === "Unsustainable") {
          return (
            <span style={{
              padding: '2px 8px',
              border: '1px solid rgb(243, 157, 161)',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              color: 'rgb(224, 10, 21)',
              backgroundColor: 'rgb(252, 230, 231)',
              fontSize: 11,
              fontWeight: 600,
            }}>{value}</span>
          );
        }
        return value;
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.getValue("sustainability_status_value") === "Unsustainable" ? 0 : 1;
        const b = rowB.getValue("sustainability_status_value") === "Unsustainable" ? 0 : 1;
        return a - b;
      },
    },
    { accessorKey: "long_extent", header: "Long Ext", size: 80, minSize: 60 },
    { accessorKey: "lat_extent", header: "Lat Ext", size: 80, minSize: 60 },
    { accessorKey: "long_raster", header: "Long Raster", size: 90, minSize: 60 },
    { accessorKey: "lat_raster", header: "Lat Raster", size: 80, minSize: 60 },
    { accessorKey: "combined_extent", header: "Combined Ext", size: 100, minSize: 60 },
  ], []);

  return (
    <div className="table-responsive-container" ref={containerRef}>
      <MaterialReactTable
        columns={columns}
        data={tableData}
        enableColumnResizing
        columnResizeMode="onChange"
        enableStickyHeader
        enableStickyFooter
        enableDensityToggle
        enableFullScreenToggle
        enableGlobalFilter
        enableColumnFilters
        enablePagination
        enablePinning
        initialState={{
          density: 'compact',
          pagination: { pageIndex: 0, pageSize: 100 },
          showColumnFilters: false,
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
            width: '100%',
          },
        }}
        muiTableContainerProps={{
          sx: {
            flex: 1,
            minHeight: 0,
            maxHeight: `${tableHeight - 110}px`,
            overflow: 'auto',
          },
        }}
        muiTablePaperProps={{
          elevation: 0,
          sx: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
        muiTopToolbarProps={{
          sx: { flexShrink: 0, minHeight: 48 },
        }}
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: '#e8eaf0',
            fontWeight: 700,
            fontSize: 12,
            py: '6px',
            px: '8px',
            borderRight: '1px solid #d0d4dc',
            '&:last-child': { borderRight: 'none' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}
        muiTableBodyCellProps={{
          sx: {
            fontSize: 12,
            py: '4px',
            px: '8px',
            borderBottom: '1px solid #f0f0f0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}
        muiTableBodyRowProps={{
          sx: {
            '&:nth-of-type(even)': { backgroundColor: '#fafcff' },
            '&:hover td': { backgroundColor: '#e8f0fe' },
          },
        }}
        muiBottomToolbarProps={{
          sx: { flexShrink: 0, minHeight: 48 },
        }}
        renderTopToolbarCustomActions={() => (
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, color: '#263238', pl: 1 }}>
            GlenCore Group (11047151)
          </Typography>
        )}
      />
    </div>
  );
};

export default ClientAssetsTable;
