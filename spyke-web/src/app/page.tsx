import HomeClient from './HomeClient'
import { HOME_CSS } from './home-styles'

export default function Home() {
  return (
    <>
      <style>{HOME_CSS}</style>
      <HomeClient />
    </>
  )
}
