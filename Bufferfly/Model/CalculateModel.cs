using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bufferfly.Model
{
    public class CalculateModel
    {
        [Required(ErrorMessage ="Desired ph is required")]
        [Range(0.1,14, ErrorMessage ="ph Ranges from 0 to 14")]
        
        public double PH { get; set; }
        [Required(ErrorMessage = "Total volume is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Volume can't be equal or less than zero")]
        public double Volume { get; set; }  
        [Required(ErrorMessage = "Strength is required")]
        [Range(0.005, double.MaxValue, ErrorMessage = "Strength can't be equal or less than zero")]
        public double strength { get; set; }    


        public string minmax { get; set; }   = string.Empty;    
    }
}
