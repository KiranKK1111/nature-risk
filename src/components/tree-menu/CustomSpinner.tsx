import * as React from "react";
import { CircularProgress } from '@mui/material';
import { Box } from '@mui/system';

export default function CustomSpinner(): JSX.Element | null {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
            }}
        >
            <CircularProgress />
        </Box>
    );
}
