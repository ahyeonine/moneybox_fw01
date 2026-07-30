import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import SimBar from '../../components/SimBar.jsx'
import PrepList from './PrepList.jsx'
import TransactionProcess from './TransactionProcess.jsx'

export default function OperatorConsole() {
  const { t } = useI18n()
  const [tab, setTab] = useState('prep')

  return (
    <div>
      <h1>{t('op.title')}</h1>
      <SimBar />
      <div className="tabs" style={{ marginTop: 16 }}>
        <button className={tab === 'prep' ? 'active' : ''} onClick={() => setTab('prep')}>
          {t('op.tab.prep')}
        </button>
        <button className={tab === 'tx' ? 'active' : ''} onClick={() => setTab('tx')}>
          {t('op.tab.tx')}
        </button>
      </div>
      {tab === 'prep' ? <PrepList /> : <TransactionProcess />}
    </div>
  )
}
