import React from 'react';
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
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { NatureTableData } from './table-data';

export const TableView: React.FC = () => {
  let currentCategory = '';
  let categoryRowSpan = 0;
  const categorySpans = new Map<string, number>();

  // Calculate rowspan for each category
  NatureTableData.forEach((row) => {
    categorySpans.set(row.category, (categorySpans.get(row.category) || 0) + 1);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 600, color: '#555' }}>
        Metals & Mining Nature-related Use of Proceeds & Key Performance Indicators
      </Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650, border: '1px solid #ddd' }} size="small">
          <TableHead>
            {/* Main Header Row */}
            <TableRow sx={{ bgcolor: '#1976d2' }}>
              <TableCell 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  border: '1px solid #ddd',
                  minWidth: 150 
                }}
              >
                Nature Thematic
              </TableCell>
              <TableCell 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  border: '1px solid #ddd',
                  minWidth: 300 
                }}
              >
                Potential Use of Proceeds (UoP)
              </TableCell>
              <TableCell 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  border: '1px solid #ddd',
                  minWidth: 300 
                }}
              >
                Potential Sustainability-linked Key Performance Indicators (KPIs)
              </TableCell>
              <TableCell 
                colSpan={3}
                align="center"
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  border: '1px solid #ddd' 
                }}
              >
                Alignment with Frameworks
              </TableCell>
            </TableRow>
            {/* Sub-header Row for Alignment columns */}
            <TableRow sx={{ bgcolor: '#1976d2' }}>
              <TableCell sx={{ border: '1px solid #ddd' }}></TableCell>
              <TableCell sx={{ border: '1px solid #ddd' }}></TableCell>
              <TableCell sx={{ border: '1px solid #ddd' }}></TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  border: '1px solid #ddd',
                  fontSize: '0.75rem',
                  minWidth: 100
                }}
              >
                MDB¹ Nature Finance Taxonomy Nov'25
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  border: '1px solid #ddd',
                  fontSize: '0.75rem',
                  minWidth: 100
                }}
              >
                ICMA Sustainable Bonds For Nature Jun'25
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  border: '1px solid #ddd',
                  fontSize: '0.75rem',
                  minWidth: 120
                }}
              >
                SCB's Green & Sustainable Finance Framework
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {NatureTableData.map((row, index) => {
              const isNewCategory = row.category !== currentCategory;
              if (isNewCategory) {
                currentCategory = row.category;
                categoryRowSpan = categorySpans.get(row.category) || 1;
              }

              return (
                <React.Fragment key={row.id}>
                  {/* Category Header Row */}
                  {isNewCategory && (
                    <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                      <TableCell 
                        colSpan={6}
                        sx={{ 
                          fontWeight: 'bold', 
                          border: '1px solid #ddd',
                          fontSize: '0.85rem',
                          py: 1
                        }}
                      >
                        {row.category}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {/* Data Row */}
                  <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ border: '1px solid #ddd', verticalAlign: 'top', fontSize: '0.85rem' }}>
                      {row.natureThematic}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #ddd', verticalAlign: 'top', fontSize: '0.85rem' }}>
                      <Box component="ul" sx={{ pl: 2, my: 0 }}>
                        {row.useOfProceeds.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #ddd', verticalAlign: 'top', fontSize: '0.85rem' }}>
                      <Box component="ul" sx={{ pl: 2, my: 0, listStyle: 'none' }}>
                        {row.kpis.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ border: '1px solid #ddd' }}>
                      {row.mdbNatureFinance && <CheckIcon sx={{ color: '#4caf50' }} />}
                    </TableCell>
                    <TableCell align="center" sx={{ border: '1px solid #ddd' }}>
                      {row.icmaSustainableBonds && <CheckIcon sx={{ color: '#4caf50' }} />}
                    </TableCell>
                    <TableCell align="center" sx={{ border: '1px solid #ddd' }}>
                      {row.scbGreenSustainable ? <CheckIcon sx={{ color: '#4caf50' }} /> : '---'}
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footnotes */}
      <Box sx={{ fontSize: '0.75rem', color: '#666', mt: 1 }}>
        <Typography variant="caption" display="block">
          1. Multilateral Development Banks (MDBs) comprising of Asian Infrastructure Investment Bank, World Bank Group etc.
        </Typography>
        <Typography variant="caption" display="block">
          2. Based on market guidance (i.e. ICMA), the KPI on 'water withdrawal' needs to be from areas of water scarcity. Therefore, an asset level assessment is required to determine if these areas are in water scarce locations for this KPI to be applicable.
        </Typography>
        <Typography variant="caption" display="block">
          3. Potential UoP and KPIs are non-exhaustive. Note that we will seek to uplift the GSFF based on market developments and on a need to basis.
        </Typography>
      </Box>
    </Box>
  );
};