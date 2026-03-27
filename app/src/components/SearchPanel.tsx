import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import {
  Autocomplete,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import type { PropertyOption } from '../types';

interface SearchPanelProps {
  options: PropertyOption[];
  selected: PropertyOption | null;
  onChange: (value: PropertyOption | null) => void;
  mapOpen: boolean;
  onMapOpen: () => void;
  onMapClose: () => void;
}

function PropertyMapDialog({
  open,
  options,
  selected,
  onClose,
  onSelect,
}: {
  open: boolean;
  options: PropertyOption[];
  selected: PropertyOption | null;
  onClose: () => void;
  onSelect: (value: PropertyOption) => void;
}) {
  const minLat = Math.min(...options.map((option) => option.lat));
  const maxLat = Math.max(...options.map((option) => option.lat));
  const minLng = Math.min(...options.map((option) => option.lng));
  const maxLng = Math.max(...options.map((option) => option.lng));

  const xFor = (lng: number) => ((lng - minLng) / (maxLng - minLng || 1)) * 100;
  const yFor = (lat: number) => 100 - ((lat - minLat) / (maxLat - minLat || 1)) * 100;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        Pick a property on the map
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Paper
          variant="outlined"
          sx={{
            position: 'relative',
            height: 420,
            overflow: 'hidden',
            borderRadius: 4,
            background:
              'radial-gradient(circle at top left, rgba(29,53,87,0.08), transparent 35%), linear-gradient(180deg, #eef6fb 0%, #f7f2e9 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(29,53,87,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(29,53,87,0.08) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {options.map((option) => {
            const isSelected = option.id === selected?.id;
            return (
              <Box
                key={option.id}
                onClick={() => {
                  onSelect(option);
                  onClose();
                }}
                sx={{
                  position: 'absolute',
                  left: `calc(${xFor(option.lng)}% - 14px)`,
                  top: `calc(${yFor(option.lat)}% - 14px)`,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: isSelected ? 'primary.main' : 'secondary.main',
                  border: '3px solid white',
                  boxShadow: 3,
                  cursor: 'pointer',
                  transition: 'transform 120ms ease',
                  '&:hover': { transform: 'scale(1.08)' },
                }}
                title={option.address}
              />
            );
          })}

          <Stack
            spacing={1.5}
            sx={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              p: 2,
              maxWidth: 360,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.94)',
              boxShadow: 2,
            }}
          >
            <Typography variant="subtitle2">Demo property map</Typography>
            <Typography variant="body2" color="text.secondary">
              Click a marker to select a property, then the app will call the backend and fetch suburb
              growth from the three configured sites.
            </Typography>
          </Stack>
        </Paper>
      </DialogContent>
    </Dialog>
  );
}

export function SearchPanel({ options, selected, onChange, mapOpen, onMapOpen, onMapClose }: SearchPanelProps) {
  return (
    <>
      <Paper sx={{ p: 3.5 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Search for a property
              </Typography>
              <Typography color="text.secondary">
                Type an address and pick from the dropdown, or choose the property directly on the map.
              </Typography>
            </Box>
            <Chip
              icon={<MapRoundedIcon />}
              label="Map enabled"
              color="primary"
              variant="outlined"
            />
          </Stack>

          <Autocomplete
            options={options}
            value={selected}
            onChange={(_, value) => onChange(value)}
            getOptionLabel={(option) => option.address}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Stack spacing={0.5} py={0.5}>
                  <Typography fontWeight={700}>{option.address}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip size="small" label={`${option.suburb}, ${option.state} ${option.postcode}`} />
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<HomeWorkRoundedIcon />}
                      label={option.propertyType}
                    />
                  </Stack>
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Property"
                placeholder="Type an address"
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
              cursor: 'pointer',
            }}
            onClick={onMapOpen}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <PlaceRoundedIcon color="primary" />
              <Box>
                <Typography fontWeight={700}>Open map picker</Typography>
                <Typography color="text.secondary">
                  Click here to choose one of the available properties from the visual map selector.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Paper>

      <PropertyMapDialog
        open={mapOpen}
        options={options}
        selected={selected}
        onClose={onMapClose}
        onSelect={onChange}
      />
    </>
  );
}
