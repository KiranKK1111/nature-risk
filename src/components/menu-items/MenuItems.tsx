import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as MuiIconButton,
  Grow,
  Slide,
  Tooltip,
} from '@mui/material';
import {
  KeyboardArrowDown,
  Close,
  BarChart,
  GridOn,
  TableChart,
  Whatshot,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { ChartView } from './ChartView';
import { HeatmapView } from './HeatmapView';
import { TableView } from './TableView';
import { GridView } from './GridView';

type ViewType = 'chart' | 'heatmap' | 'table' | 'grid' | null;

interface MenuItemsProps {
  selectedClient?: string[];
  selectedSector?: string;
}

function MenuItems({ selectedClient, selectedSector }: MenuItemsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const openView = (view: ViewType) => {
    setActiveView(view);
  };

  const closeView = () => {
    setActiveView(null);
  };

  // Resolve the client API name from the display name
  // The first selected client is used for per-client data
  const activeClientDisplay = selectedClient && selectedClient.length > 0 ? selectedClient[0] : undefined;

  const menuItems = [
    { id: 'chart', icon: <BarChart />, label: 'Overall results', component: ChartView },
    { id: 'heatmap', icon: <Whatshot />, label: 'Heatmaps', component: HeatmapView },
    { id: 'table', icon: <TableChart />, label: 'Nature financing thematic', component: TableView },
    { id: 'grid', icon: <GridOn />, label: 'Details', component: GridView },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        pointerEvents: 'none',
      }}
    >
      {/* Down Arrow */}
      <Box
        onClick={toggleMenu}
        sx={{
          position: 'absolute',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto',
          '&:hover': {
            transform: 'translateX(-50%) scale(1.1)',
          },
        }}
      >
        {menuOpen ? (
          <KeyboardArrowUp sx={{ fontSize: 50, color: 'primary.main' }} />
        ) : (
          <KeyboardArrowDown
            sx={{
              fontSize: 50,
              color: 'primary.main',
              animation: 'arrow-bounce 2s infinite',
              '@keyframes arrow-bounce': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(4px)' },
              },
            }}
          />
        )}
      </Box>

      {/* Animated Icon Menu */}
      <Box
        sx={{
          position: 'absolute',
          top: 140,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          zIndex: 999,
          pointerEvents: 'auto',
        }}
      >
        {menuItems.map((item, index) => (
          <Grow
            key={item.id}
            in={menuOpen}
            timeout={300 + index * 150}
            style={{
              transformOrigin: 'center top',
            }}
          >
            <Box>
              <Slide
                direction="down"
                in={menuOpen}
                timeout={400 + index * 150}
              >
                <Tooltip title={item.label} arrow>
                  <IconButton
                    onClick={() => openView(item.id as ViewType)}
                    sx={{
                      bgcolor: 'white',
                      width: 48,
                      height: 48,
                      boxShadow: 2,
                      transition: 'all 0.3s ease',
                      animation: menuOpen ? `bubble-up 0.6s ease ${index * 0.15}s` : 'none',
                      '@keyframes bubble-up': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(-20px) scale(0.8)',
                        },
                        '50%': {
                          transform: 'translateY(5px) scale(1.1)',
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0) scale(1)',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'white',
                        boxShadow: 6,
                        transform: 'translateY(-4px) scale(1.15)',
                      },
                    }}
                  >
                    {React.cloneElement(item.icon, { sx: { fontSize: 24 } })}
                  </IconButton>
                </Tooltip>
              </Slide>
            </Box>
          </Grow>
        ))}
      </Box>

      {/* Dialogs for each view */}
      {menuItems.map((item) => (
        <Dialog
          key={item.id}
          open={activeView === item.id}
          onClose={closeView}
          maxWidth="lg"
          fullWidth
          sx={{
            zIndex: 9999,
          }}
          PaperProps={{
            sx: {
              minHeight: '80vh',
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {item.icon}
              {item.label}
            </Box>
            <MuiIconButton onClick={closeView} size="small">
              <Close />
            </MuiIconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {activeView === item.id && <item.component selectedClient={activeClientDisplay} selectedSector={selectedSector} />}
          </DialogContent>
        </Dialog>
      ))}
    </Box>
  );
}

export default MenuItems;