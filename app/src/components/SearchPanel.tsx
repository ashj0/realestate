import { useEffect, useMemo, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
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
import type { PropertyAutocompleteOption, PropertyOption } from '../types';

interface SearchPanelProps {
  options: PropertyOption[];
  selected: PropertyOption | null;
  onChange: (value: PropertyOption | null) => void;
  mapOpen: boolean;
  onMapOpen: () => void;
  onMapClose: () => void;
  apiBaseUrl: string;
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

export function SearchPanel({ options, selected, onChange, mapOpen, onMapOpen, onMapClose, apiBaseUrl }: SearchPanelProps) {
  const [searchText, setSearchText] = useState(selected?.address ?? '');
  const [autocompleteOptions, setAutocompleteOptions] = useState<PropertyAutocompleteOption[]>(selected ? [selected] : []);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!selected);

  useEffect(() => {
    setSearchText(selected?.address ?? '');
    setAutocompleteOptions((current) => {
      if (!selected) return current;
      const next = [selected, ...current.filter((option) => option.id !== selected.id)];
      return next.slice(0, 8);
    });
    if (selected) {
      setExpanded(false);
    }
  }, [selected]);

  useEffect(() => {
    const query = searchText.trim();
    if (query.length < 3) {
      setAutocompleteOptions(selected ? [selected] : []);
      setLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(`${apiBaseUrl}/property-autocomplete?q=${encodeURIComponent(query)}`);
        const data = (await response.json()) as PropertyAutocompleteOption[];
        const next = selected ? [selected, ...data.filter((option) => option.id !== selected.id)] : data;
        setAutocompleteOptions(next);
      } catch {
        setAutocompleteOptions(selected ? [selected] : []);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [apiBaseUrl, searchText, selected]);

  const mapOptions = useMemo(() => {
    const lookup = new Map<string, PropertyOption>();
    for (const option of options) lookup.set(option.id, option);
    for (const option of autocompleteOptions) lookup.set(option.id, option);
    return Array.from(lookup.values());
  }, [options, autocompleteOptions]);

  return (
    <>
      <Paper sx={{ p: selected ? 2.25 : 3.5, width: '100%' }}>
        <Stack spacing={selected ? 1.5 : 3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Box>
              <Typography variant={selected ? 'h6' : 'h5'} gutterBottom={!selected}>
                Search for a property
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {selected
                  ? `Selected: ${selected.address}`
                  : 'Type an address and pick from the live dropdown, or choose the property directly on the map.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip icon={<MapRoundedIcon />} label="Map enabled" color="primary" variant="outlined" />
              {selected ? (
                <Button variant="text" size="small" onClick={() => setExpanded((current) => !current)}>
                  {expanded ? 'Minimise' : 'Change property'}
                </Button>
              ) : null}
            </Stack>
          </Stack>

          <Collapse in={expanded || !selected}>
            <Stack spacing={2.5}>
              <Autocomplete
                filterOptions={(items) => items}
                options={autocompleteOptions}
                value={selected}
                inputValue={searchText}
                onInputChange={(_, value) => setSearchText(value)}
                onChange={(_, value) => onChange(value)}
                getOptionLabel={(option) => option.address}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={searchText.trim().length < 3 ? 'Type at least 3 characters' : 'No matching properties found'}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Stack spacing={0.5} py={0.5}>
                      <Typography fontWeight={700}>{option.address}</Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip size="small" label={`${option.suburb}, ${option.state} ${option.postcode}`} />
                        <Chip size="small" variant="outlined" icon={<HomeWorkRoundedIcon />} label={option.propertyType} />
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
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Paper
                variant="outlined"
                sx={{
                  p: 2.25,
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
                    <Typography color="text.secondary" variant="body2">
                      Click here to choose one of the currently available properties from the visual map selector.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      <PropertyMapDialog
        open={mapOpen}
        options={mapOptions}
        selected={selected}
        onClose={onMapClose}
        onSelect={onChange}
      />
    </>
  );
}
