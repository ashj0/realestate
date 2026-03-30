import { useEffect, useMemo, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import EditLocationAltRoundedIcon from '@mui/icons-material/EditLocationAltRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
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
  onManualSubmit: (value: Omit<PropertyOption, 'lat' | 'lng'>) => void;
  mapOpen: boolean;
  onMapOpen: () => void;
  onMapClose: () => void;
  apiBaseUrl: string;
}

const australianStates = ['NSW', 'QLD', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

const suburbPostcodeHints: Record<string, { state: string; postcode: string }> = {
  rivervale: { state: 'WA', postcode: '6103' },
  bondi: { state: 'NSW', postcode: '2026' },
  'new farm': { state: 'QLD', postcode: '4005' },
  richmond: { state: 'VIC', postcode: '3121' },
  subiaco: { state: 'WA', postcode: '6008' },
  unley: { state: 'SA', postcode: '5061' },
};

function titleCaseWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function parseRealestatePropertyUrl(value: string): {
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType: 'house' | 'unit';
} | null {
  const match = value.trim().match(/^https?:\/\/(?:www\.)?realestate\.com\.au\/property\/([^/?#]+)\/?(?:\?.*)?$/i);
  if (!match) return null;

  const slug = match[1]?.trim().toLowerCase();
  if (!slug) return null;

  const propertyType: 'house' | 'unit' = slug.startsWith('unit-') ? 'unit' : 'house';
  const parts = slug.split('-').filter(Boolean);
  const postcodeIndex = parts.findIndex((part) => /^\d{4}$/.test(part));
  if (postcodeIndex < 2) return null;

  const stateIndex = postcodeIndex - 1;
  const state = parts[stateIndex]?.toUpperCase() ?? '';
  if (!state || !/^[A-Z]{2,3}$/.test(state) || state === 'UNIT') return null;
  const postcode = parts[postcodeIndex] ?? '';
  const suburb = titleCaseWords(parts.slice(stateIndex + 1, postcodeIndex).join(' '));
  const addressStartIndex = propertyType === 'unit' ? 2 : 0;
  const address = titleCaseWords(parts.slice(addressStartIndex, stateIndex).join(' '));

  if (!address || !suburb || !state || !postcode) return null;

  return { address, suburb, state, postcode, propertyType };
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

export function SearchPanel({ options, selected, onChange, onManualSubmit, mapOpen, onMapOpen, onMapClose, apiBaseUrl }: SearchPanelProps) {
  const [searchText, setSearchText] = useState(selected?.address ?? '');
  const [autocompleteOptions, setAutocompleteOptions] = useState<PropertyAutocompleteOption[]>(selected ? [selected] : []);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!selected);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualSuburb, setManualSuburb] = useState('');
  const [manualState, setManualState] = useState('WA');
  const [manualPostcode, setManualPostcode] = useState('');
  const [manualPropertyType, setManualPropertyType] = useState<'house' | 'unit'>('unit');
  const [manualSuccessMessage, setManualSuccessMessage] = useState('');
  const [manualSelectionActive, setManualSelectionActive] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    setAutocompleteOptions((current) => {
      if (!selected) return current;
      const next = [selected, ...current.filter((option) => option.id !== selected.id)];
      return next.slice(0, 8);
    });

    setSearchText(selected?.address ?? '');
    setExpanded(!selected);
    setManualSelectionActive(Boolean(selected?.isManual));

    if (selected?.isManual) {
      setManualDialogOpen(false);
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
      setSearchError('');

      try {
        const response = await fetch(`${apiBaseUrl}/property-autocomplete?q=${encodeURIComponent(query)}`);
        const raw = await response.json();
        const data = Array.isArray(raw) ? (raw as PropertyAutocompleteOption[]) : [];

        if (!response.ok) {
          const message = raw && typeof raw === 'object' && 'errors' in raw && Array.isArray((raw as { errors?: unknown }).errors)
            ? ((raw as { errors: string[] }).errors.join(' · ') || 'Autocomplete failed')
            : 'Autocomplete failed';
          setSearchError(message);
        }

        const next = selected ? [selected, ...data.filter((option) => option.id !== selected.id)] : data;
        setAutocompleteOptions(next);
      } catch {
        setAutocompleteOptions(selected ? [selected] : []);
        setSearchError('Autocomplete failed');
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

  const parsedManualUrl = parseRealestatePropertyUrl(manualAddress.trim());
  const resolvedManualSuburb = (parsedManualUrl?.suburb ?? manualSuburb).trim();
  const resolvedManualState = (parsedManualUrl?.state ?? manualState).trim();
  const resolvedManualPostcode = (parsedManualUrl?.postcode ?? manualPostcode).trim();
  const suburbHint = suburbPostcodeHints[resolvedManualSuburb.toLowerCase()];
  const postcodeLooksValid = resolvedManualPostcode.length === 4;
  const postcodeMismatch = Boolean(
    suburbHint && postcodeLooksValid && (suburbHint.state !== resolvedManualState || suburbHint.postcode !== resolvedManualPostcode)
  );
  const canUseManualProperty =
    manualAddress.trim().length > 0 &&
    resolvedManualSuburb.length > 0 &&
    resolvedManualPostcode.length === 4 &&
    !postcodeMismatch;

  function openManualDialog() {
    const parsedUrl = parseRealestatePropertyUrl(searchText.trim());

    setManualDialogOpen(true);
    setManualAddress(parsedUrl?.address ?? searchText.trim());
    setManualSuburb(parsedUrl?.suburb ?? selected?.suburb ?? '');
    setManualState(parsedUrl?.state ?? selected?.state ?? 'NSW');
    setManualPostcode(parsedUrl?.postcode ?? selected?.postcode ?? '');
    setManualPropertyType(parsedUrl?.propertyType ?? selected?.propertyType ?? 'house');
  }

  function handleManualSubmit() {
    const parsedUrl = parseRealestatePropertyUrl(manualAddress.trim());
    const address = (parsedUrl?.address ?? manualAddress).trim();
    const suburb = (parsedUrl?.suburb ?? manualSuburb).trim();
    const postcode = (parsedUrl?.postcode ?? manualPostcode).trim();

    if (!canUseManualProperty || !manualState) {
      return;
    }

    const fullAddress = `${address}, ${suburb} ${manualState} ${postcode}`;

    onManualSubmit({
      id: `manual-${Date.now()}`,
      address: fullAddress,
      suburb,
      state: parsedUrl?.state ?? manualState,
      postcode,
      propertyType: parsedUrl?.propertyType ?? manualPropertyType,
    });

    setManualSelectionActive(true);
    setSearchText(fullAddress);
    setManualSuccessMessage(`Manual property selected: ${fullAddress}`);
    setManualDialogOpen(false);
    setExpanded(false);
  }

  return (
    <>
      <Paper sx={{ p: selected && !expanded ? 1.75 : selected ? 2.25 : 3.5, width: '100%' }}>
        <Stack spacing={selected && !expanded ? 1 : selected ? 1.5 : 3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Box>
              <Typography variant={selected ? 'h6' : 'h5'} gutterBottom={!selected} sx={{ fontWeight: 700 }}>
                Search for a property
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {selected
                  ? expanded
                    ? `Selected: ${selected.address}`
                    : selected.address
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
              {manualSuccessMessage ? <Alert severity="success">{manualSuccessMessage}</Alert> : null}
              {searchError ? <Alert severity="warning">{searchError}</Alert> : null}

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

              <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, bgcolor: 'warning.50' }}>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 700 }}>Can&apos;t find the property?</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Apartment and unit addresses may not appear in autocomplete. Use manual entry anytime.
                  </Typography>
                  <Button variant="outlined" startIcon={<EditLocationAltRoundedIcon />} onClick={openManualDialog}>
                    Enter address manually
                  </Button>
                </Stack>
              </Paper>

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

      <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6 }}>
          Enter property manually
          <IconButton onClick={() => setManualDialogOpen(false)} sx={{ position: 'absolute', right: 12, top: 12 }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Street address"
              value={manualAddress}
              onChange={(event) => {
                const nextValue = event.target.value;
                setManualAddress(nextValue);

                const parsedUrl = parseRealestatePropertyUrl(nextValue);
                if (parsedUrl) {
                  setManualSuburb(parsedUrl.suburb);
                  setManualState(parsedUrl.state);
                  setManualPostcode(parsedUrl.postcode);
                  setManualPropertyType(parsedUrl.propertyType);
                }
              }}
              fullWidth
            />
            <TextField
              label="Suburb"
              value={manualSuburb}
              onChange={(event) => {
                const nextSuburb = event.target.value;
                setManualSuburb(nextSuburb);
                const hint = suburbPostcodeHints[nextSuburb.trim().toLowerCase()];
                if (hint) {
                  setManualState(hint.state);
                  setManualPostcode(hint.postcode);
                }
              }}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="State"
                value={manualState}
                onChange={(event) => setManualState(event.target.value)}
                fullWidth
                error={postcodeMismatch}
              >
                {australianStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Postcode"
                value={manualPostcode}
                onChange={(event) => setManualPostcode(event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                fullWidth
                error={postcodeMismatch}
                helperText={
                  postcodeMismatch && suburbHint
                    ? `${resolvedManualSuburb} is usually ${suburbHint.state} ${suburbHint.postcode}`
                    : ' '
                }
              />
            </Stack>
            <TextField
              select
              label="Property type"
              value={manualPropertyType}
              onChange={(event) => setManualPropertyType(event.target.value as 'house' | 'unit')}
              fullWidth
            >
              <MenuItem value="unit">Unit</MenuItem>
              <MenuItem value="house">House</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setManualDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleManualSubmit} disabled={!canUseManualProperty}>
            Use manual property
          </Button>
        </DialogActions>
      </Dialog>

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
