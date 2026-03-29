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
  const [existingLoanInterestRate, setExistingLoanInterestRate] = useState('6');
  const [retainedEquityPercent, setRetainedEquityPercent] = useState('20');
  const [otpPurchasePrice, setOtpPurchasePrice] = useState('750000');
  const [otpPropertyCount, setOtpPropertyCount] = useState('2');
  const [otpDepositPercent, setOtpDepositPercent] = useState('10');
  const [useDepositBond, setUseDepositBond] = useState(true);
  const [otpActualUpfrontCash, setOtpActualUpfrontCash] = useState('20000');
  const [otpPrincipalInterestCost, setOtpPrincipalInterestCost] = useState('60000');
  const [otpAnnualGrowthPercent, setOtpAnnualGrowthPercent] = useState('7');
  const [otpYearsToCompletion, setOtpYearsToCompletion] = useState('2');
  const [showMap, setShowMap] = useState(false);
  const [result, setResult] = useState<EstimateApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    return Boolean(
      selectedProperty &&
      Number(lastYearValuation) > 0 &&
      Number(loanBalance) >= 0 &&
      Number(sellingCostPercent) >= 0 &&
      Number(existingLoanInterestRate) >= 0 &&
      Number(retainedEquityPercent) >= 0
    );
  }, [selectedProperty, lastYearValuation, loanBalance, sellingCostPercent, existingLoanInterestRate, retainedEquityPercent]);

  const totalEquity = useMemo(() => {
    if (!result?.result.currentValuation) return null;
    return result.result.currentValuation - (Number(loanBalance) || 0);
  }, [result, loanBalance]);

  const netDeployableEquity = useMemo(() => {
    if (!result?.result.currentValuation) return null;
    const currentValuation = result.result.currentValuation;
    const sellingCosts = currentValuation * ((Number(sellingCostPercent) || 0) / 100);
    return currentValuation - (Number(loanBalance) || 0) - sellingCosts;
  }, [result, loanBalance, sellingCostPercent]);

  const usableEquityIfHeld = useMemo(() => {
    if (totalEquity === null || !result?.result.currentValuation) return null;
    const retainedEquityAmount = result.result.currentValuation * ((Number(retainedEquityPercent) || 0) / 100);
    return totalEquity - retainedEquityAmount;
  }, [totalEquity, result, retainedEquityPercent]);

  const existingInterestOnlyCost3Years = useMemo(() => {
    const annualInterestOnlyCost = (Number(loanBalance) || 0) * ((Number(existingLoanInterestRate) || 0) / 100);
    return annualInterestOnlyCost * 3;
  }, [loanBalance, existingLoanInterestRate]);

  const otpScenario = useMemo(() => {
    const purchasePrice = Number(otpPurchasePrice) || 0;
    const propertyCount = Number(otpPropertyCount) || 0;
    const depositPercent = Number(otpDepositPercent) || 0;
    const actualUpfrontCashPerProperty = Number(otpActualUpfrontCash) || 0;
    const principalInterestCost = Number(otpPrincipalInterestCost) || 0;
    const annualGrowthPercent = Number(otpAnnualGrowthPercent) || 0;
    const yearsToCompletion = Number(otpYearsToCompletion) || 0;
    const depositAmount = purchasePrice * (depositPercent / 100);
    const actualUpfrontCash = useDepositBond ? actualUpfrontCashPerProperty : depositAmount;
    const forecastCompletionValue = purchasePrice * Math.pow(1 + annualGrowthPercent / 100, yearsToCompletion);
    const forecastEquityGainPerProperty = forecastCompletionValue - purchasePrice;
    const retainedEquityPerProperty = forecastCompletionValue * ((Number(retainedEquityPercent) || 0) / 100);
    const usableOtpEquityPerProperty = forecastCompletionValue - retainedEquityPerProperty;
    const totalUpfrontCashNeeded = actualUpfrontCash * propertyCount;
    const totalProjectedGain = forecastEquityGainPerProperty * propertyCount;
    const totalUsableOtpEquity = usableOtpEquityPerProperty * propertyCount;
    const fundingSurplusShortfall = netDeployableEquity === null ? null : netDeployableEquity - totalUpfrontCashNeeded;

    return {
      purchasePrice,
      propertyCount,
      depositPercent,
      actualUpfrontCashPerProperty,
      principalInterestCost,
      annualGrowthPercent,
      yearsToCompletion,
      totalUpfrontCashNeeded,
      totalProjectedGain,
      totalUsableOtpEquity,
      fundingSurplusShortfall,
    };
  }, [
    otpPurchasePrice,
    otpPropertyCount,
    otpDepositPercent,
    otpActualUpfrontCash,
    otpPrincipalInterestCost,
    otpAnnualGrowthPercent,
    otpYearsToCompletion,
    useDepositBond,
    netDeployableEquity,
    retainedEquityPercent,
  ]);

  async function handleGenerateEstimate() {
    if (
      !selectedProperty ||
      Number(lastYearValuation) <= 0 ||
      Number(loanBalance) < 0 ||
      Number(sellingCostPercent) < 0 ||
      Number(existingLoanInterestRate) < 0 ||
      Number(retainedEquityPercent) < 0
    ) {
      setError('Select a property and enter valid valuation, loan balance, selling costs, interest, and retained equity values first.');
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
        <Stack spacing={2}>
          <Header />

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(320px, 3fr)' },
              alignItems: 'start',
            }}
          >
            <Stack spacing={2} sx={{ minWidth: 0 }}>
              <SearchPanel
                options={propertyOptions}
                selected={selectedProperty}
                onChange={setSelectedProperty}
                onManualSubmit={(value) =>
                  setSelectedProperty({
                    ...value,
                    lat: -31.9523,
                    lng: 115.8613,
                    isManual: true,
                  })
                }
                mapOpen={showMap}
                onMapOpen={() => setShowMap(true)}
                onMapClose={() => setShowMap(false)}
                apiBaseUrl={API_BASE_URL}
              />
              <SelectedSuburbCard property={selectedProperty} />
              {result ? (
                <EstimateSummaryCard
                  result={result}
                  loanBalance={Number(loanBalance) || 0}
                  sellingCostPercent={Number(sellingCostPercent) || 0}
                  existingLoanInterestRate={Number(existingLoanInterestRate) || 0}
                  retainedEquityPercent={Number(retainedEquityPercent) || 0}
                />
              ) : null}
            </Stack>

            <Stack spacing={2} sx={{ minWidth: 0 }}>
              <ValuationForm
                valuation={lastYearValuation}
                loanBalance={loanBalance}
                sellingCostPercent={sellingCostPercent}
                existingLoanInterestRate={existingLoanInterestRate}
                retainedEquityPercent={retainedEquityPercent}
                onValuationChange={setLastYearValuation}
                onLoanBalanceChange={setLoanBalance}
                onSellingCostPercentChange={setSellingCostPercent}
                onExistingLoanInterestRateChange={setExistingLoanInterestRate}
                onRetainedEquityPercentChange={setRetainedEquityPercent}
                disabled={!canGenerate || loading}
                onSubmit={handleGenerateEstimate}
              />
              {result ? <SourceBreakdown siteEstimates={result.siteEstimates} /> : null}
            </Stack>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {result ? (
            <Stack spacing={2} sx={{ mt: 0 }}>
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
                  principalInterestCost={otpPrincipalInterestCost}
                  annualGrowthPercent={otpAnnualGrowthPercent}
                  yearsToCompletion={otpYearsToCompletion}
                  onPurchasePriceChange={setOtpPurchasePrice}
                  onPropertyCountChange={setOtpPropertyCount}
                  onDepositPercentChange={setOtpDepositPercent}
                  onUseDepositBondChange={setUseDepositBond}
                  onActualUpfrontCashChange={setOtpActualUpfrontCash}
                  onPrincipalInterestCostChange={setOtpPrincipalInterestCost}
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
                  retainedEquityPercent={Number(retainedEquityPercent) || 0}
                  netDeployableEquity={netDeployableEquity}
                  principalInterestCost={otpScenario.principalInterestCost}
                />
              </Box>

              <StrategyOutcomeCard
                valuationConfidence={result.confidence}
                growthPercent={result.result.growthPercent}
                currentValuation={result.result.currentValuation}
                totalEquity={totalEquity}
                usableEquityIfHeld={usableEquityIfHeld}
                netDeployableEquity={netDeployableEquity}
                totalProjectedGain={otpScenario.totalProjectedGain}
                totalUsableOtpEquity={otpScenario.totalUsableOtpEquity}
                totalUpfrontCashNeeded={otpScenario.totalUpfrontCashNeeded}
                fundingSurplusShortfall={otpScenario.fundingSurplusShortfall}
                principalInterestCost={otpScenario.principalInterestCost}
                existingInterestOnlyCost3Years={existingInterestOnlyCost3Years}
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
