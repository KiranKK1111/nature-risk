import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, Button, ButtonGroup, IconButton, Menu, MenuItem, CircularProgress } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { HeatmapDataItem } from './heatmap-data';
// @ts-ignore — dataService is a .jsx file
import { fetchHeatmapData } from '../../services/dataService';

// Helper function to return complete labels without truncation
const formatLabel = (label: string): string => {
  return label;
};

// Allowed values only
const allowedValues = [0, 0.1, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

// Transform data for Nivo HeatMap
const transformDataForNivo = (dataItem: HeatmapDataItem) => {
  return dataItem.companies.map((company: string) => {
    const companyValues = dataItem.values[company];
    return {
      id: company,
      data: dataItem.riskCategories.map((category: string, index: number) => ({
        x: category,
        y: companyValues[index]
      }))
    };
  });
};

// Color mapping for each specific value - exact match to the image
const getColor = (value: number): string => {
  const colorMap: { [key: number]: string } = {
    0: '#00FF00',      // Bright Green
    0.1: '#00FF00',    // Bright Green
    0.2: '#FFFF00',    // Yellow
    0.4: '#00FF00',    // Bright Green
    0.5: '#FFFF00',    // Yellow
    0.6: '#FFA500',    // Orange
    0.7: '#FFA500',    // Orange
    0.8: '#FF8C00',    // Dark Orange
    0.9: '#FF6347',    // Red-Orange
    1: '#FF0000',      // Red
  };
  
  return colorMap[value] || '#CCCCCC'; // Default gray for unexpected values
};

// Export to CSV function
const exportToCSV = (data: any[], categories: string[], viewType: string) => {
  // Create header row
  const header = ['Company', ...categories].join(',');
  
  // Create data rows
  const rows = data.map(row => {
    const values = row.data.map((d: any) => (d.y || 0).toFixed(1));
    return [row.id, ...values].join(',');
  });
  
  // Combine header and rows
  const csv = [header, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `heatmap_${viewType}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to PDF function (capture heatmap only)
const exportToPDF = async (element: HTMLElement | null, viewType: string) => {
  if (!element) return;
  
  try {
    // Dynamically import html2canvas and jspdf
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions to fit content
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Convert pixels to mm (assuming 96 DPI)
    const pxToMm = 0.264583;
    const pdfWidth = imgWidth * pxToMm;
    const pdfHeight = imgHeight * pxToMm;
    
    // Create PDF with custom size to fit the entire heatmap
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`heatmap_${viewType}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.log('Error generating PDF:', error);
    // Fallback to browser print
    window.print();
  }
};

interface HeatmapViewProps {
  selectedClient?: string;
  selectedSector?: string;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({ selectedClient }) => {
  const [viewType, setViewType] = useState<'pressures' | 'dependencies'>('pressures');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<HeatmapDataItem[] | null>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);

  // Fetch from API when selectedClient changes
  useEffect(() => {
    if (!selectedClient) return;
    const controller = new AbortController();
    setIsLoading(true);
    fetchHeatmapData(selectedClient, controller.signal)
      .then((data: HeatmapDataItem[]) => setApiData(data))
      .catch((err: any) => {
        if (err?.name !== 'CanceledError') {
          console.error('Failed to load heatmap data:', err);
        }
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [selectedClient]);

  // Get current configuration and data
  const currentConfig = useMemo(() => {
    if (!apiData) return null;
    const config = apiData.find((item: HeatmapDataItem) =>
      item.category === viewType.toUpperCase() as 'PRESSURES' | 'DEPENDENCIES'
    );
    return config || apiData[0] || null;
  }, [viewType, apiData]);
  const heatmapData = useMemo(() => currentConfig ? transformDataForNivo(currentConfig) : [], [currentConfig]);
  
  // Memoize handlers
  const handleViewTypeChange = useCallback((newViewType: 'pressures' | 'dependencies') => {
    if (viewType === newViewType) return; // Prevent unnecessary updates
    
    setIsLoading(true);
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      setViewType(newViewType);
      // Delay hiding loading to ensure render is complete
      requestAnimationFrame(() => {
        setIsLoading(false);
      });
    });
  }, [viewType]);

  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setAnchorEl(null);
  };

  const handleExportCSV = () => {
    if (!currentConfig) return;
    exportToCSV(heatmapData, currentConfig.riskCategories, viewType);
    handleDownloadClose();
  };

  const handleExportPDF = () => {
    exportToPDF(heatmapRef.current, viewType);
    handleDownloadClose();
  };

  if (!currentConfig || !apiData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5">
            {currentConfig.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {currentConfig.subLabel}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ButtonGroup variant="contained" sx={{ boxShadow: 2 }}>
            <Button
              onClick={() => handleViewTypeChange('pressures')}
              variant={viewType === 'pressures' ? 'contained' : 'outlined'}
              disabled={isLoading}
              sx={{
                bgcolor: viewType === 'pressures' ? 'primary.main' : 'white',
                color: viewType === 'pressures' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: viewType === 'pressures' ? 'primary.dark' : 'grey.100',
                },
              }}
            >
              Pressures
            </Button>
            <Button
              onClick={() => handleViewTypeChange('dependencies')}
              variant={viewType === 'dependencies' ? 'contained' : 'outlined'}
              disabled={isLoading}
              sx={{
                bgcolor: viewType === 'dependencies' ? 'primary.main' : 'white',
                color: viewType === 'dependencies' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: viewType === 'dependencies' ? 'primary.dark' : 'grey.100',
                },
              }}
            >
              Dependencies
            </Button>
          </ButtonGroup>
          
          <IconButton
            onClick={handleDownloadClick}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <DownloadIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleDownloadClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  boxShadow: 3,
                },
              },
            }}
            sx={{
              zIndex: 9999,
            }}
          >
            <MenuItem onClick={handleExportCSV}>Download as CSV</MenuItem>
            <MenuItem onClick={handleExportPDF}>Download as PDF</MenuItem>
          </Menu>
        </Box>
      </Box>

      <Paper ref={heatmapRef} elevation={3} sx={{ p: 1, position: 'relative' }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1000,
            }}
          >
            <CircularProgress size={60} />
          </Box>
        )}
        <Box sx={{ height: 1200, opacity: isLoading ? 0.3 : 1, transition: 'opacity 0.3s' }}>
          <ResponsiveHeatMap
            key={`heatmap-${viewType}`}
            data={heatmapData}
            margin={{ top: 60, right: 90, bottom: 280, left: 180 }}
            forceSquare={false}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: '',
              legendOffset: 46,
              format: (value) => formatLabel(String(value)),
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: '',
              legendPosition: 'middle',
              legendOffset: -40,
            }}
            colors={(cell) => getColor(cell.value as number)}
            emptyColor="#555555"
            borderColor="#999"
            borderWidth={1}
            enableLabels={true}
            label={(cell) => (cell.value === 0 ? '0.0' : (cell.value || 0).toFixed(1))}
            labelTextColor="#000000"
            animate={false}
            motionConfig="default"
            legends={[
              {
                anchor: 'bottom',
                translateX: 0,
                translateY: 50,
                length: 400,
                thickness: 20,
                direction: 'row',
                tickPosition: 'after',
                tickSize: 3,
                tickSpacing: 4,
                tickOverlap: false,
                tickFormat: '>-.1f',
                title: 'Risk Level →',
                titleAlign: 'start',
                titleOffset: 4,
              },
            ]}
            hoverTarget="cell"
            tooltip={({ cell }) => (
              <Box
                sx={{
                  background: 'white',
                  padding: '9px 12px',
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  boxShadow: 2,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {cell.serieId}
                </Typography>
                <Typography variant="caption">
                  {cell.data.x}: {(cell.value as number).toFixed(1)}
                </Typography>
              </Box>
            )}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fontSize: 10,
                    fill: '#000',
                  },
                },
              },
              labels: {
                text: {
                  fontSize: 11,
                  fontWeight: 'bold',
                  fill: '#000',
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};
