import React, { useState } from 'react';
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
} from '@mui/material';

interface GridDataRow {
  company: string;
  category: string;
  variable: string;
  exposure: number;
  level: string;
}

const gridData: GridDataRow[] = [
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Aerosol", exposure: 22.5, level: "direct" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Aerosol", exposure: 28.0, level: "direct" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Biogeochemical flows", exposure: 31.1, level: "direct" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Biogeochemical flows", exposure: 57.1, level: "direct" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Biosphere integrity", exposure: 38.1, level: "direct" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Biosphere integrity", exposure: 53.9, level: "direct" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Climate change", exposure: 31.3, level: "direct" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Climate change", exposure: 0, level: "direct" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Freshwater use", exposure: 62.7, level: "direct" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Freshwater use", exposure: 35.3, level: "direct" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Landsystem change", exposure: 13.0, level: "direct" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Landsystem change", exposure: 22.9, level: "direct" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Ocean acidification", exposure: 11.1, level: "direct" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Ocean acidification", exposure: 11.9, level: "direct" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Stratospheric ozone", exposure: 0, level: "direct" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Stratospheric ozone", exposure: 0, level: "direct" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Aerosol", exposure: 23.1, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Aerosol", exposure: 28.0, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Biogeochemical flows", exposure: 57.6, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Biogeochemical flows", exposure: 57.1, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Biosphere integrity", exposure: 48.2, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Biosphere integrity", exposure: 53.9, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Climate change", exposure: 56.8, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Climate change", exposure: 0, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Freshwater use", exposure: 72.9, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Freshwater use", exposure: 35.3, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Landsystem change", exposure: 56.6, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Landsystem change", exposure: 22.9, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Ocean acidification", exposure: 13.7, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Ocean acidification", exposure: 11.9, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Dependency", variable: "Stratospheric ozone", exposure: 0, level: "indirect" },
  { company: "GLENCORE GROUP", category: "Pressure", variable: "Stratospheric ozone", exposure: 0, level: "indirect" },
];

export const GridView: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<'direct' | 'indirect' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'Dependency' | 'Pressure' | 'all'>('all');

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