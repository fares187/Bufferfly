using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bufferfly.Model
{
    public class ChemicalCompound
    {
        public string Name { get; set; }

        public double Pka { get; set; } 

        public double MinPH { get; set; }   
        public double MaxPH { get; set; }   


        public string AcidName { get; set; }   
        public string AcidFormula { get; set; }  
        public double AcidMolecularWeight { get; set; }
        public int AcidN { get; set; }


        public string BasicName { get; set; }
        public string BasicFormula { get; set; }
        public double BasicMolecularWeight { get; set; }
        public int BasicN{ get; set; }




        public string RoomTemp { get; set; }
        public string Refrigeratednon { get; set; }
        public string Refrigerated { get; set; }












        public bool IsVisible { get; set; } = true;

        public double Opacity { get; set; } = 1;
        public int RelativePosition { get; set; }
        public double Scale { get; set; } = 1;
        public string ModelUrl { get; set; }




        
    }
}
