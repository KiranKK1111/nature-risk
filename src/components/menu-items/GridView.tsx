import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
} from '@mui/material';
// @ts-ignore — dataService is a .jsx file
import { fetchGridData } from '../../services/dataService';

interface GridDataRow {
  company: string;
  category: string;
  variable: string;
  exposure: number;
  level: string;
}


interface GridViewProps {
  selectedClient?: string;
  selectedSector?: string;
}

export const GridView: React.FC<GridViewProps> = ({ selectedClient }) => {
  const [selectedLevel, setSelectedLevel] = useState<'direct' | 'indirect' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'Dependency' | 'Pressure' | 'all'>('all');
  const [apiData, setApiData] = useState<GridDataRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch from API when selectedClient changes
  useEffect(() => {
    if (!selectedClient) return;
    const controller = new AbortController();
    setLoading(true);
    fetchGridData(selectedClient, controller.signal)
      .then((data: GridDataRow[]) => setApiData(data))
      .catch((err: any) => {
        if (err?.name !== 'CanceledError') console.error('Failed to load grid data:', err);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedClient]);

  const gridData = apiData || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Filter data based on selections
  const filteredData = gridData.filter(row => {
    const levelMatch = selectedLevel === 'all' || row.level === selectedLevel;
    const categoryMatch = selectedCategory === 'all' || row.category === selectedCategory;
    return levelMatch && categoryMatch;
  });

  // Get color for exposure level
  const getExposureColor = (exposure: number) => {
    if (exposure === 0) return '#e0e0e0';
    if (exposure < 20) return '#c8e6c9';
    if (exposure < 40) return '#fff59d';
    if (exposure < 60) return '#ffcc80';
    return '#ef9a9a';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        Nature-related Dependencies & Pressures - Grid View
      </Typography>

      {/* Filter Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
        {/* Level Filter */}
        <Box>
          <Typography variant="subtitle2" align="center" sx={{ mb: 1 }}>
            Exposure Level
          </Typography>
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={selectedLevel === 'all' ? 'contained' : 'outlined'}
              onClick={() => setSelectedLevel('all')}
            >
              All
            </Button>
            <Button
              variant={selectedLevel === 'direct' ? 'contained' : 'outlined'}
              onClick={() => setSelectedLevel('direct')}
            >
              Direct
            </Button>
            <Button
              variant={selectedLevel === 'indirect' ? 'contained' : 'outlined'}
              onClick={() => setSelectedLevel('indirect')}
            >
              Indirect
            </Button>
          </ButtonGroup>
        </Box>

        {/* Category Filter */}
        <Box>
          <Typography variant="subtitle2" align="center" sx={{ mb: 1 }}>
            Category
          </Typography>
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={selectedCategory === 'all' ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'Dependency' ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory('Dependency')}
            >
              Dependencies
            </Button>
            <Button
              variant={selectedCategory === 'Pressure' ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory('Pressure')}
            >
              Pressures
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Data Grid */}
      <Paper elevation={3}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1976d2' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>
                  Company
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>
                  Category
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>
                  Variable
                </TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>
                  Exposure (%)
                </TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>
                  Level
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:hover': { bgcolor: '#f5f5f5' },
                    bgcolor: index % 2 === 0 ? '#fafafa' : 'white'
                  }}
                >
                  <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'medium' }}>
                    {row.company}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #ddd' }}>
                    <Chip
                      label={row.category}
                      size="small"
                      color={row.category === 'Dependency' ? 'success' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #ddd' }}>
                    {row.variable}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: '1px solid #ddd',
                      bgcolor: getExposureColor(row.exposure),
                      fontWeight: 'bold'
                    }}
                  >
                    {row.exposure.toFixed(1)}
                  </TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #ddd' }}>
                    <Chip
                      label={row.level.toUpperCase()}
                      size="small"
                      color={row.level === 'direct' ? 'warning' : 'info'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Typography variant="caption" color="text.secondary" align="center">
        Showing {filteredData.length} of {gridData.length} records
      </Typography>
    </Box>
  );
};