using GoogleMapsEditor;
using System.ComponentModel.DataAnnotations;

namespace Testsite;

public class ListItem
{
    // This would require custom serialization to work, but we skip it as IList<T> isn't 100 % supported, and instead we should use IList<TBlock>
    //public virtual GoogleMapsCoordinates? ListItemCoordinates { get; set; }

    [UIHint(GoogleMapsEditorDescriptor.UIHint)]
    public virtual string? ListItemStringCoordinates { get; set; }
}
