import React, { useState } from 'react';
import { Box, Typography, Paper, Button, ButtonGroup, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CustomToolTipContent, HeatmapDataDirect, HeatmapDataIndirect, radarChartConfig } from './radar-data';
import { PlanetaryBoundaryData } from './table-data';
import { getAssetUrl } from '../../utils/publicPath';
import { CustomAngleTick } from './CustomAngleTick';
// import { CustomAngleTick } from './CustomAngleTick';

type Category = 'PRESSURES' | 'DEPENDENCIES' | 'OVERALL';
type ExposureType = 'direct' | 'indirect';
type ViewType = 'radar' | 'table';

export const ChartView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('OVERALL');
  const [selectedExposure, setSelectedExposure] = useState<ExposureType>('indirect');
  const [selectedView, setSelectedView] = useState<ViewType>('radar');

  // Get the appropriate data based on selections
  const dataSource = selectedExposure === 'direct' ? HeatmapDataDirect : HeatmapDataIndirect;
  const selectedData = dataSource.find(item => item.category === selectedCategory);
  const chartData = selectedData?.data || [];

  // Update subtitle based on exposure type
  const subtitle = selectedExposure === 'direct' 
    ? 'Direct exposure levels (%)'
    : 'Indirect exposure levels (%)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        {radarChartConfig.title}
      </Typography>

      {/* View Type Selection Buttons (Radar Data / Table Data) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <ButtonGroup variant="outlined" size="large">
          <Button
            variant={selectedView === 'radar' ? 'contained' : 'outlined'}
            onClick={() => setSelectedView('radar')}
          >
            Radar Data
          </Button>
          <Button
            variant={selectedView === 'table' ? 'contained' : 'outlined'}
            onClick={() => setSelectedView('table')}
          >
            Table Data
          </Button>
        </ButtonGroup>
      </Box>

      {/* Category Selection Buttons - Only show for Radar Data */}
      {selectedView === 'radar' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <ButtonGroup variant="outlined" size="medium">
            <Button
              variant={selectedCategory === 'PRESSURES' ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory('PRESSURES')}
            >
              Pressures
            </Button>
            <Button
              variant={selectedCategory === 'DEPENDENCIES' ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory('DEPENDENCIES')}
            >
              Dependencies
            </Button>
            <Button
              variant={selectedCategory === 'OVERALL' ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory('OVERALL')}
            >
              Overall
            </Button>
          </ButtonGroup>
        </Box>
      )}

      {/* Exposure Type Selection Buttons - Only show for Radar Data */}
      {selectedView === 'radar' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={selectedExposure === 'direct' ? 'contained' : 'outlined'}
              onClick={() => setSelectedExposure('direct')}
            >
              Direct
            </Button>
            <Button
              variant={selectedExposure === 'indirect' ? 'contained' : 'outlined'}
              onClick={() => setSelectedExposure('indirect')}
            >
              Indirect
            </Button>
          </ButtonGroup>
        </Box>
      )}

      {selectedView === 'radar' && (
        <Typography variant="body2" color="text.secondary" align="center">
          {subtitle}
        </Typography>
      )}

      {/* Conditional Rendering based on View Type */}
      {selectedView === 'radar' ? (
        /* Radar Chart Only */
        <Paper elevation={3} sx={{ p: 3 }}>
          <div style={{ position: 'relative', zIndex: 1000 }}>
            <ResponsiveContainer width="100%" height={radarChartConfig.height}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#ccc" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={(props) => <CustomAngleTick {...props} />}
                  tickLine={false}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={radarChartConfig.domain} 
                  tick={{ fill: '#666', fontSize: 10 }}
                  tickCount={radarChartConfig.tickCount}
                />
                {(selectedCategory === 'PRESSURES' || selectedCategory === 'OVERALL') && (
                  <Radar
                    name="Pressures"
                    dataKey="Pressures"
                    stroke={radarChartConfig.colors.pressures.stroke}
                    fill={radarChartConfig.colors.pressures.fill}
                    fillOpacity={radarChartConfig.fillOpacity}
                    strokeWidth={radarChartConfig.strokeWidth}
                  />
                )}
                {(selectedCategory === 'DEPENDENCIES' || selectedCategory === 'OVERALL') && (
                  <Radar
                    name="Dependencies"
                    dataKey="Dependencies"
                    stroke={radarChartConfig.colors.dependencies.stroke}
                    fill={radarChartConfig.colors.dependencies.fill}
                    fillOpacity={radarChartConfig.fillOpacity}
                    strokeWidth={radarChartConfig.strokeWidth}
                  />
                )}
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Paper>
      ) : (
        /* Planetary Boundary Indicators Table */
        <Paper elevation={3} sx={{ p: 2 }}>
          <TableContainer>
            <Table size="small" sx={{ border: '1px solid #ddd' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#1976d2' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>
                    Planetary Boundary
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>
                    Pressure
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>
                    Dependency
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PlanetaryBoundaryData.map((row, rowIndex) => {
                  const maxRows = Math.max(row.pressures.length, row.dependencies.length);
                  
                  return Array.from({ length: maxRows }).map((_, subRowIndex) => {
                    const isFirstSubRow = subRowIndex === 0;
                    
                    // Determine if we should show pressure cell
                    const hasPressure = subRowIndex < row.pressures.length;
                    const isLastPressure = subRowIndex === row.pressures.length - 1;
                    const pressureRowSpan = (hasPressure && isLastPressure) ? maxRows - subRowIndex : 1;
                    
                    // Determine if we should show dependency cell
                    const hasDependency = subRowIndex < row.dependencies.length;
                    const isLastDependency = subRowIndex === row.dependencies.length - 1;
                    const dependencyRowSpan = (hasDependency && isLastDependency) ? maxRows - subRowIndex : 1;
                    
                    return (
                      <TableRow key={`${rowIndex}-${subRowIndex}`}>
                        {isFirstSubRow && (
                          <TableCell 
                            rowSpan={maxRows}
                            sx={{ 
                              border: '1px solid #ddd', 
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              verticalAlign: 'middle'
                            }}
                          >
                            {row.boundary}
                          </TableCell>
                        )}
                        
                        {hasPressure && (
                          <TableCell 
                            rowSpan={pressureRowSpan}
                            sx={{ 
                              border: '1px solid #ddd',
                              fontSize: '0.8rem',
                              verticalAlign: 'middle',
                              p: 1
                            }}
                          >
                            {row.pressures[subRowIndex]}
                          </TableCell>
                        )}
                        
                        {hasDependency && (
                          <TableCell 
                            rowSpan={dependencyRowSpan}
                            sx={{ 
                              border: '1px solid #ddd',
                              fontSize: '0.8rem',
                              verticalAlign: 'middle',
                              p: 1
                            }}
                          >
                            {row.dependencies[subRowIndex]}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  });
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};