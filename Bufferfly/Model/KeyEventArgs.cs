using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BufferCalculator.Model
{
    public class KeyEventArgs : EventArgs
    {
        public string Key { get; }

        public KeyEventArgs(string key)
        {
            Key = key;
        }
    }
}
