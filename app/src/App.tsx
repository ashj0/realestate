import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
} from '@mui/material';
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { SelectedSuburbCard } from './components/SelectedSuburbCard';
import { ValuationForm } from './components/ValuationForm';
import { EstimateSummaryCard } from './components/EstimateSummaryCard';
import { SourceBreakdown } from './components/SourceBreakdown';
import { SourceEstimateList } from './components/SourceEstimateList';
import { OtpScenarioForm } from './components/OtpScenarioForm';
import { OtpForecastSummaryCard } from './components/OtpForecastSummaryCard';
import { StrategyOutcomeCard } from './components/StrategyOutcomeCard';
import { propertyOptions } from './data/mockData';
import type { EstimateApiResponse, PropertyOption } from './types';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export default function App() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(propertyOptions[0]);
  const [lastYearValuation, setLastYearValuation] = useState('1850000');
  const [loanBalance, setLoanBalance] = useState('400000');
  const [sellingCostPercent, setSellingCostPercent] = useState('3');
  const [otpPurchasePrice, setOtpPurchasePrice] = useState('750000');
  const [otpPropertyCount, setOtpPropertyCount] = useState('2');
  const [otpDepositPercent, setOtpDepositPercent] = useState('10');
  const [useDepositBond, setUseDepositBond] = useState(true);
  const [otpActualUpfrontCash, setOtpActualUpfrontCash] = useState('20000');
  const [otpAnnualGrowthPercent, setOtpAnnualGrowthPercent] = useState('7');
  const [otpYearsToCompletion, setOtpYearsToCompletion] = useState('2');
  const [showMap, setShowMap] = useState(false);
  const [result, setResult] = useState<EstimateApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    return Boolean(selectedProperty && Number(lastYearValuation) > 0 && Number(loanBalance) >= 0 && Number(sellingCostPercent) >= 0);
  }, [selectedProperty, lastYearValuation, loanBalance, sellingCostPercent]);

  const netDeployableEquity = useMemo(() => {
    if (!result?.result.currentValuation) return null;
    const currentValuation = result.result.currentValuation;
    const sellingCosts = currentValuation * ((Number(sellingCostPercent) || 0) / 100);
    return currentValuation - (Number(loanBalance) || 0) - sellingCosts;
  }, [result, loanBalance, sellingCostPercent]);

  const otpScenario = useMemo(() => {
    const purchasePrice = Number(otpPurchasePrice) || 0;
    const propertyCount = Number(otpPropertyCount) || 0;
    const depositPercent = Number(otpDepositPercent) || 0;
    const actualUpfrontCashPerProperty = Number(otpActualUpfrontCash) || 0;
    const annualGrowthPercent = Number(otpAnnualGrowthPercent) || 0;
    const yearsToCompletion = Number(otpYearsToCompletion) || 0;
    const depositAmount = purchasePrice * (depositPercent / 100);
    const actualUpfrontCash = useDepositBond ? actualUpfrontCashPerProperty : depositAmount;
    const forecastCompletionValue = purchasePrice * Math.pow(1 + annualGrowthPercent / 100, yearsToCompletion);
    const forecastEquityGainPerProperty = forecastCompletionValue - purchasePrice;
    const totalUpfrontCashNeeded = actualUpfrontCash * propertyCount;
    const totalProjectedGain = forecastEquityGainPerProperty * propertyCount;
    const fundingSurplusShortfall = netDeployableEquity === null ? null : netDeployableEquity - totalUpfrontCashNeeded;

    return {
      purchasePrice,
      propertyCount,
      depositPercent,
      actualUpfrontCashPerProperty,
      annualGrowthPercent,
      yearsToCompletion,
      totalUpfrontCashNeeded,
      totalProjectedGain,
      fundingSurplusShortfall,
    };
  }, [
    otpPurchasePrice,
    otpPropertyCount,
    otpDepositPercent,
    otpActualUpfrontCash,
    otpAnnualGrowthPercent,
    otpYearsToCompletion,
    useDepositBond,
    netDeployableEquity,
  ]);

  async function handleGenerateEstimate() {
    if (!selectedProperty || Number(lastYearValuation) <= 0 || Number(loanBalance) < 0 || Number(sellingCostPercent) < 0) {
      setError('Select a property and enter a valid valuation, loan balance, and selling costs first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suburb: selectedProperty.suburb,
          address: selectedProperty.address,
          state: selectedProperty.state,
          postCode: selectedProperty.postcode,
          propertyType: selectedProperty.propertyType,
          lastYearValuation: Number(lastYearValuation),
          principal: Number(loanBalance),
          comparableType: 'sold',
          currency: 'AUD',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.join(' · ') ?? 'Failed to fetch estimate');
      }

      setResult(data as EstimateApiResponse);
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to fetch estimate');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, rgba(29,53,87,0.10) 0%, rgba(245,241,234,1) 22%, rgba(245,241,234,1) 100%)',
        py: 3,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={2.5}>
          <Header />

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(320px, 3fr)' },
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <SearchPanel
                options={propertyOptions}
                selected={selectedProperty}
                onChange={setSelectedProperty}
                mapOpen={showMap}
                onMapOpen={() => setShowMap(true)}
                onMapClose={() => setShowMap(false)}
                apiBaseUrl={API_BASE_URL}
              />
            </Box>
            <Box sx={{ minWidth: 0, gridRow: { xs: 'auto', lg: 'span 2' } }}>
              <ValuationForm
                valuation={lastYearValuation}
                loanBalance={loanBalance}
                sellingCostPercent={sellingCostPercent}
                onValuationChange={setLastYearValuation}
                onLoanBalanceChange={setLoanBalance}
                onSellingCostPercentChange={setSellingCostPercent}
                disabled={!canGenerate || loading}
                onSubmit={handleGenerateEstimate}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <SelectedSuburbCard property={selectedProperty} />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {result ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(320px, 3fr)' },
                  alignItems: { xs: 'start', lg: 'stretch' },
                }}
              >
                <Box sx={{ minWidth: 0, display: 'flex' }}>
                  <EstimateSummaryCard
                    result={result}
                    loanBalance={Number(loanBalance) || 0}
                    sellingCostPercent={Number(sellingCostPercent) || 0}
                  />
                </Box>
                <Box sx={{ minWidth: 0, display: 'flex' }}>
                  <SourceBreakdown siteEstimates={result.siteEstimates} />
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px, 1fr) minmax(0, 2fr)' },
                  alignItems: 'start',
                }}
              >
                <OtpScenarioForm
                  purchasePrice={otpPurchasePrice}
                  propertyCount={otpPropertyCount}
                  depositPercent={otpDepositPercent}
                  useDepositBond={useDepositBond}
                  actualUpfrontCash={otpActualUpfrontCash}
                  annualGrowthPercent={otpAnnualGrowthPercent}
                  yearsToCompletion={otpYearsToCompletion}
                  onPurchasePriceChange={setOtpPurchasePrice}
                  onPropertyCountChange={setOtpPropertyCount}
                  onDepositPercentChange={setOtpDepositPercent}
                  onUseDepositBondChange={setUseDepositBond}
                  onActualUpfrontCashChange={setOtpActualUpfrontCash}
                  onAnnualGrowthPercentChange={setOtpAnnualGrowthPercent}
                  onYearsToCompletionChange={setOtpYearsToCompletion}
                />
                <OtpForecastSummaryCard
                  purchasePrice={otpScenario.purchasePrice}
                  propertyCount={otpScenario.propertyCount}
                  depositPercent={otpScenario.depositPercent}
                  useDepositBond={useDepositBond}
                  actualUpfrontCashPerProperty={otpScenario.actualUpfrontCashPerProperty}
                  annualGrowthPercent={otpScenario.annualGrowthPercent}
                  yearsToCompletion={otpScenario.yearsToCompletion}
                  netDeployableEquity={netDeployableEquity}
                />
              </Box>

              <StrategyOutcomeCard
                valuationConfidence={result.confidence}
                growthPercent={result.result.growthPercent}
                currentValuation={result.result.currentValuation}
                netDeployableEquity={netDeployableEquity}
                totalProjectedGain={otpScenario.totalProjectedGain}
                totalUpfrontCashNeeded={otpScenario.totalUpfrontCashNeeded}
                fundingSurplusShortfall={otpScenario.fundingSurplusShortfall}
                useDepositBond={useDepositBond}
                propertyCount={otpScenario.propertyCount}
                annualGrowthPercent={otpScenario.annualGrowthPercent}
              />

              <Box sx={{ width: '100%' }}>
                <SourceEstimateList
                  siteEstimates={result.siteEstimates}
                  selectedComparables={result.selectedComparables}
                />
              </Box>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
