import "./globals.css";
import Nav from "@/components/Nav";
export const metadata={title:"BrickAlpha",description:"LEGO inventory and investment intelligence"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Nav/><main className="main">{children}</main></body></html>}
