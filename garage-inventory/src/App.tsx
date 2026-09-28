import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ExportPage } from './pages/ExportPage'
import { ItemPage } from './pages/ItemPage'
import { LabelsPage } from './pages/LabelsPage'
import { LocationPage } from './pages/LocationPage'
import { LocationsPage } from './pages/LocationsPage'
import { MapPage } from './pages/MapPage'
import { ScanPage } from './pages/ScanPage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'
import { init } from './store'

export default function App() {
  useEffect(() => {
    init()
  }, [])
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<SearchPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="l/:code" element={<LocationPage />} />
          <Route path="i/:id" element={<ItemPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="labels" element={<LabelsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
