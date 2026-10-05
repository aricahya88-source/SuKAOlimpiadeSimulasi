export const G = 9.81;
export function state(m:number,k:number,amplitude:number,t:number,oscillating:boolean){
  const equilibrium=m*G/k,omega=Math.sqrt(k/m);
  const a=oscillating?Math.min(amplitude,equilibrium):0;
  const displacement=a*Math.cos(omega*t),velocity=-a*omega*Math.sin(omega*t);
  return {equilibrium,extension:equilibrium+displacement,displacement,velocity,period:2*Math.PI/omega,springForce:k*(equilibrium+displacement),weight:m*G,potential:.5*k*displacement**2,kinetic:.5*m*velocity**2,energy:.5*k*a*a};
}
