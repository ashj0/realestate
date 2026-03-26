import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import {
  Autocomplete,
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SuburbOption } from '../data/mockData';

interface SearchPanelProps {
  options: SuburbOption[];
  selected: SuburbOption | null;
  onChange: (value: SuburbOption | null) => void;
}

export function SearchPanel({ options, selected, onChange }: SearchPanelProps) {
  return (
    <Paper sx={{ p: 3.5 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" gutterBottom>
              Search for a suburb
            </Typography>
            <Typography color="text.secondary">
              Start with a suburb search or use the map entry point below.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<MapRoundedIcon />}>
            Open map picker
          </Button>
        </Stack>

        <Autocomplete
          options={options}
          value={selected}
          onChange={(_, value) => onChange(value)}
          getOptionLabel={(option) => `${option.suburb}, ${option.state} ${option.postcode}`}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Suburb"
              placeholder="Type a suburb name"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderStyle: 'dashed',
            borderRadius: 4,
            bgcolor: 'grey.50',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <PlaceRoundedIcon color="primary" />
            <Box>
              <Typography fontWeight={700}>Map selection placeholder</Typography>
              <Typography color="text.secondary">
                Wire this to a suburb-level map provider later. For now, the button above is a UI
                stub so the layout is ready.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
