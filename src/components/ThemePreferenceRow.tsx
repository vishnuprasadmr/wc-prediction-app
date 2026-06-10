import { useTheme } from '../contexts/ThemeContext'

import type { ThemePreference } from '../lib/theme'



const options: { value: ThemePreference; label: string; hint: string }[] = [

  { value: 'system', label: 'System', hint: 'Device setting' },

  { value: 'light', label: 'Light', hint: 'Always day' },

  { value: 'dark', label: 'Dark', hint: 'Always night' },

]



export function ThemePreferenceRow() {

  const { preference, setPreference } = useTheme()



  return (

    <div className="rounded-xl bg-card p-4">

      <p className="mb-3 text-sm font-medium text-subtle">Appearance</p>

      <div className="grid grid-cols-3 gap-2">

        {options.map(({ value, label, hint }) => {

          const active = preference === value

          return (

            <button

              key={value}

              type="button"

              onClick={() => setPreference(value)}

              className={`rounded-xl border px-2 py-2.5 text-center transition ${

                active

                  ? 'border-simelabs/50 bg-simelabs/15 text-simelabs'

                  : 'border-default bg-muted/50 text-muted hover:text-theme'

              }`}

            >

              <span className="block text-sm font-semibold">{label}</span>

              <span className="mt-0.5 block text-[10px] leading-tight opacity-80">{hint}</span>

            </button>

          )

        })}

      </div>

    </div>

  )

}


